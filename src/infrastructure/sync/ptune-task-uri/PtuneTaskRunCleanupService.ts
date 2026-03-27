import { App } from "obsidian";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { logger } from "../../../shared/logger/loggerInstance";
import { PtuneTaskWorkDir } from "./PtuneTaskWorkDir";

type CleanupProfile = "prod" | "dev";
type RunCategory = "success" | "error" | "running" | "unknown";

interface CleanupThreshold {
  days: number;
  count: number;
}

interface CleanupPolicy {
  success: CleanupThreshold;
  error: CleanupThreshold;
  staleRunningHours: number;
}

interface RunCleanupConfigFile {
  profile?: string;
}

interface RunStatusFile {
  status?: string;
  phase?: string;
  updated_at?: string;
  timestamp?: string;
}

interface RunRequestFile {
  created_at?: string;
}

interface RunEntry {
  requestId: string;
  dirPath: string;
  category: RunCategory;
  timestampMs: number;
}

export interface RunCleanupSummary {
  profile: CleanupProfile;
  scanned: number;
  removed: number;
  kept: number;
}

const POLICIES: Record<CleanupProfile, CleanupPolicy> = {
  dev: {
    success: { days: 7, count: 100 },
    error: { days: 7, count: 100 },
    staleRunningHours: 24,
  },
  prod: {
    success: { days: 3, count: 10 },
    error: { days: 7, count: 20 },
    staleRunningHours: 24,
  },
};

export class PtuneTaskRunCleanupService {
  constructor(
    private readonly app: App,
    private readonly workDir = new PtuneTaskWorkDir(app),
  ) {}

  async ensureConfigExists(): Promise<void> {
    await this.workDir.ensureRunCleanupConfigExists();
  }

  async cleanupOnStartup(): Promise<RunCleanupSummary> {
    await this.ensureConfigExists();
    return this.cleanup("startup");
  }

  async cleanupBeforeRun(): Promise<RunCleanupSummary> {
    await this.ensureConfigExists();
    return this.cleanup("before-run");
  }

  async cleanupNow(): Promise<RunCleanupSummary> {
    await this.ensureConfigExists();
    return this.cleanup("manual");
  }

  private async cleanup(reason: "startup" | "before-run" | "manual"): Promise<RunCleanupSummary> {
    const profile = await this.loadProfile();
    const policy = POLICIES[profile];
    const runsDir = this.workDir.getRunsAbsolute();

    try {
      const entries = await this.readRunEntries(runsDir);
      const toRemove = this.selectRunsToRemove(entries, policy);

      for (const entry of toRemove) {
        await fs.rm(entry.dirPath, { recursive: true, force: true });
      }

      const summary: RunCleanupSummary = {
        profile,
        scanned: entries.length,
        removed: toRemove.length,
        kept: Math.max(0, entries.length - toRemove.length),
      };

      logger.info(
        `[Sync] [RunCleanup] reason=${reason} profile=${profile} scanned=${summary.scanned} removed=${summary.removed} kept=${summary.kept}`,
      );
      return summary;
    } catch (error) {
      logger.warn(`[Sync] [RunCleanup] reason=${reason} failed`, error);
      return {
        profile,
        scanned: 0,
        removed: 0,
        kept: 0,
      };
    }
  }

  private async loadProfile(): Promise<CleanupProfile> {
    const configPath = this.workDir.getRunCleanupConfigAbsolute();

    try {
      const raw = await fs.readFile(configPath, "utf8");
      const parsed = JSON.parse(raw) as RunCleanupConfigFile;
      return parsed.profile === "dev" ? "dev" : "prod";
    } catch {
      return "prod";
    }
  }

  private async readRunEntries(runsDir: string): Promise<RunEntry[]> {
    try {
      const dirents = await fs.readdir(runsDir, { withFileTypes: true });
      const runs = dirents.filter((entry) => entry.isDirectory());
      const entries = await Promise.all(
        runs.map((entry) => this.inspectRun(path.join(runsDir, entry.name), entry.name)),
      );
      return entries.filter((entry): entry is RunEntry => entry !== null);
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  private async inspectRun(dirPath: string, requestId: string): Promise<RunEntry | null> {
    const status = await this.readJsonFile<RunStatusFile>(path.join(dirPath, "status.json"));
    const request = await this.readJsonFile<RunRequestFile>(path.join(dirPath, "request.json"));
    const stat = await fs.stat(dirPath);

    const timestampMs = this.resolveTimestampMs(status, request, stat.mtimeMs);
    const category = this.resolveCategory(status);

    return {
      requestId,
      dirPath,
      category,
      timestampMs,
    };
  }

  private async readJsonFile<T>(filePath: string): Promise<T | null> {
    try {
      const raw = await fs.readFile(filePath, "utf8");
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  private resolveTimestampMs(
    status: RunStatusFile | null,
    request: RunRequestFile | null,
    fallbackMs: number,
  ): number {
    const candidate = status?.updated_at ?? status?.timestamp ?? request?.created_at;
    if (!candidate) {
      return fallbackMs;
    }

    const parsed = Date.parse(candidate);
    return Number.isNaN(parsed) ? fallbackMs : parsed;
  }

  private resolveCategory(status: RunStatusFile | null): RunCategory {
    if (status?.status === "success") {
      return "success";
    }
    if (status?.status === "error") {
      return "error";
    }
    if (status?.status === "running" || status?.phase === "accepted" || status?.phase === "running") {
      return "running";
    }
    return "unknown";
  }

  private selectRunsToRemove(entries: RunEntry[], policy: CleanupPolicy): RunEntry[] {
    const now = Date.now();
    const removable = new Map<string, RunEntry>();

    const selectByPolicy = (category: "success" | "error", threshold: CleanupThreshold): void => {
      const sorted = entries
        .filter((entry) => entry.category === category)
        .sort((left, right) => right.timestampMs - left.timestampMs);

      sorted.forEach((entry, index) => {
        const ageDays = (now - entry.timestampMs) / (24 * 60 * 60 * 1000);
        if (index >= threshold.count || ageDays > threshold.days) {
          removable.set(entry.requestId, entry);
        }
      });
    };

    selectByPolicy("success", policy.success);
    selectByPolicy("error", policy.error);

    for (const entry of entries) {
      if (entry.category !== "running" && entry.category !== "unknown") {
        continue;
      }

      const ageHours = (now - entry.timestampMs) / (60 * 60 * 1000);
      if (ageHours > policy.staleRunningHours) {
        removable.set(entry.requestId, entry);
      }
    }

    return [...removable.values()].sort((left, right) => left.timestampMs - right.timestampMs);
  }
}
