import { App } from "obsidian";
import { logger } from "../../../shared/logger/loggerInstance";
import { PtuneSyncStatusEnvelope } from "../ptune-sync-uri/PtuneSyncStatusEnvelope";
import { PtuneSyncStatusParser } from "../ptune-sync-uri/PtuneSyncStatusParser";
import { PtuneTaskWorkDir } from "./PtuneTaskWorkDir";

export class PtuneTaskStatusWatcher {
  private readonly pollIntervalMs = 500;
  private readonly startupTimeoutMs = 3000;
  private readonly completionTimeoutMs = 90000;

  constructor(
    private readonly app: App,
    private readonly workDir: PtuneTaskWorkDir,
  ) {}

  async waitForAccepted<TData>(
    requestId: string,
    baseline: Date,
  ): Promise<PtuneSyncStatusEnvelope<TData>> {
    return this.waitFor(requestId, baseline, this.startupTimeoutMs, (envelope) =>
      envelope.phase === "accepted"
      || envelope.phase === "running"
      || envelope.phase === "completed");
  }

  async waitForCompletion<TData>(
    requestId: string,
    baseline: Date,
  ): Promise<PtuneSyncStatusEnvelope<TData>> {
    return this.waitFor(requestId, baseline, this.completionTimeoutMs, (envelope) =>
      envelope.phase === "completed"
      || envelope.status === "success"
      || envelope.status === "error");
  }

  private async waitFor<TData>(
    requestId: string,
    baseline: Date,
    timeoutMs: number,
    predicate: (envelope: PtuneSyncStatusEnvelope<TData>) => boolean,
  ): Promise<PtuneSyncStatusEnvelope<TData>> {
    const timeoutAt = Date.now() + timeoutMs;

    while (Date.now() < timeoutAt) {
      const envelope = await this.tryRead<TData>(requestId);
      if (!envelope || !this.isNewer(envelope, baseline) || !this.matchesRequest(envelope, requestId)) {
        await this.delay(this.pollIntervalMs);
        continue;
      }

      if (!predicate(envelope)) {
        await this.delay(this.pollIntervalMs);
        continue;
      }

      return envelope;
    }

    throw new Error("ptune-task status wait timed out");
  }

  private async tryRead<TData>(requestId: string): Promise<PtuneSyncStatusEnvelope<TData> | null> {
    const path = this.workDir.getStatusFileRelative(requestId);

    if (!(await this.app.vault.adapter.exists(path))) {
      return null;
    }

    try {
      const raw = await this.app.vault.adapter.read(path);
      const envelope = PtuneSyncStatusParser.parse<TData>(raw);
      logger.debug(
        `[Sync] [PtuneTaskStatusWatcher] requestId=${requestId} phase=${envelope.phase ?? "<none>"} status=${envelope.status}`,
      );
      return envelope;
    } catch {
      return null;
    }
  }

  private matchesRequest(envelope: PtuneSyncStatusEnvelope, requestId: string): boolean {
    return !envelope.request_id || envelope.request_id === requestId;
  }

  private isNewer(envelope: PtuneSyncStatusEnvelope, baseline: Date): boolean {
    const value = envelope.updated_at ?? envelope.timestamp;
    const timestamp = Date.parse(value);
    return !Number.isNaN(timestamp) && timestamp > baseline.getTime();
  }

  private async delay(ms: number): Promise<void> {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }
}
