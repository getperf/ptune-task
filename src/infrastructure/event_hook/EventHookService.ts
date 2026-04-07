import { App } from "obsidian";
import { homedir } from "os";
import { dirname, join } from "path";
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import { config } from "../../config/config";
import { logger } from "../../shared/logger/loggerInstance";

type EventType = "note-create" | "note-review";
type HookStatus = "success" | "skipped" | "error" | "timeout";
type PythonStatus = "success" | "skipped" | "error";

interface EventEnvelope {
  schema_version: 1;
  request_id: string;
  event_type: EventType;
  note_path: string;
  vault_path: string;
  created_at: string;
}

interface StatusEnvelope {
  schema_version: number;
  request_id: string;
  status: PythonStatus;
  message?: string;
  updated_at?: string;
}

export interface EventHookEmitResult {
  requestId: string;
  status: HookStatus;
  message: string;
}

export interface EventHookEmitOptions {
  enabledOverride?: boolean;
}

export class EventHookService {
  constructor(private readonly app: App) {}

  async emitNoteCreate(notePath: string, options?: EventHookEmitOptions): Promise<EventHookEmitResult> {
    return this.emit("note-create", notePath, options);
  }

  async emitNoteReview(notePath: string, options?: EventHookEmitOptions): Promise<EventHookEmitResult> {
    return this.emit("note-review", notePath, options);
  }

  private async emit(eventType: EventType, notePath: string, options?: EventHookEmitOptions): Promise<EventHookEmitResult> {
    const hookEnabled = options?.enabledOverride ?? config.settings.eventHook.enabled;
    if (!hookEnabled) {
      return {
        requestId: "",
        status: "skipped",
        message: "event-hook is disabled",
      };
    }

    const vaultPath = this.resolveVaultPath();
    if (!vaultPath) {
      return {
        requestId: "",
        status: "error",
        message: "vault path could not be resolved",
      };
    }

    const requestId = this.generateRequestId();
    const createdAt = new Date().toISOString();
    const event: EventEnvelope = {
      schema_version: 1,
      request_id: requestId,
      event_type: eventType,
      note_path: notePath,
      vault_path: vaultPath,
      created_at: createdAt,
    };

    const interopRoot = this.resolveInteropRoot();
    const inboxPath = join(interopRoot, "interop", "events", "inbox", `${requestId}.json`);
    const statusPath = join(interopRoot, "interop", "status", `${requestId}.json`);

    await this.writeJsonAtomic(inboxPath, event);
    logger.info(`[EventHook] emitted eventType=${eventType} requestId=${requestId} note=${notePath}`);

    const timeoutMs = this.resolveStatusWaitMs();
    const status = await this.waitForStatus(statusPath, timeoutMs);
    if (!status) {
      return {
        requestId,
        status: "timeout",
        message: "codex-md-export daemon is not running or not responding",
      };
    }

    return {
      requestId,
      status: status.status,
      message: status.message ?? `${status.status}`,
    };
  }

  private resolveStatusWaitMs(): number {
    const value = config.settings.eventHook.statusWaitMs;
    if (!Number.isFinite(value)) {
      return 2500;
    }
    const rounded = Math.floor(value);
    return Math.max(300, rounded);
  }

  private resolveInteropRoot(): string {
    const configured = config.settings.eventHook.interopRoot.trim();
    if (configured) {
      return configured;
    }
    return join(homedir(), ".codex-md-export");
  }

  private resolveVaultPath(): string | null {
    const adapter = this.app.vault.adapter as unknown as { getBasePath?: () => string };
    if (typeof adapter.getBasePath !== "function") {
      return null;
    }
    return adapter.getBasePath();
  }

  private async waitForStatus(path: string, timeoutMs: number): Promise<StatusEnvelope | null> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      try {
        const raw = await readFile(path, "utf-8");
        const parsed = JSON.parse(raw) as StatusEnvelope;
        if (parsed && parsed.request_id && parsed.status) {
          return parsed;
        }
      } catch {
        // continue polling
      }
      await this.delay(200);
    }
    return null;
  }

  private async writeJsonAtomic(path: string, payload: unknown): Promise<void> {
    await mkdir(dirname(path), { recursive: true });
    const tmpPath = `${path}.tmp`;
    await writeFile(tmpPath, `${JSON.stringify(payload, null, 2)}\n`, "utf-8");
    await rename(tmpPath, path);
  }

  private generateRequestId(): string {
    const iso = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
    const suffix = Math.random().toString(16).slice(2, 4).padEnd(2, "0");
    return `${iso}-${suffix}`;
  }

  private async delay(ms: number): Promise<void> {
    await new Promise<void>((resolve) => window.setTimeout(resolve, ms));
  }
}
