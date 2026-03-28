import { App } from "obsidian";
import { logger } from "../../../shared/logger/loggerInstance";
import { PtuneSyncStatusEnvelope } from "../ptune-sync-uri/PtuneSyncStatusEnvelope";
import { PtuneSyncStatusParser } from "../ptune-sync-uri/PtuneSyncStatusParser";
import { PtuneTaskWorkDir } from "./PtuneTaskWorkDir";

export class PtuneTaskStatusWatcher {
  private readonly pollIntervalMs = 500;
  private readonly startupTimeoutMs = 3000;
  private readonly completionTimeoutMs = 90000;
  private readonly authLoginTimeoutMs = 300000;

  constructor(
    private readonly app: App,
    private readonly workDir: PtuneTaskWorkDir,
  ) {}

  async waitForAccepted<TData>(
    requestNonce: string,
    baseline: Date,
  ): Promise<PtuneSyncStatusEnvelope<TData>> {
    return this.waitFor(requestNonce, baseline, this.startupTimeoutMs, (envelope) =>
      envelope.phase === "accepted"
      || envelope.phase === "running"
      || envelope.phase === "completed");
  }

  async waitForCompletion<TData>(
    requestNonce: string,
    baseline: Date,
  ): Promise<PtuneSyncStatusEnvelope<TData>> {
    return this.waitForCompletionWithTimeout(requestNonce, baseline, this.completionTimeoutMs);
  }

  async waitForAuthLoginCompletion<TData>(
    requestNonce: string,
    baseline: Date,
  ): Promise<PtuneSyncStatusEnvelope<TData>> {
    return this.waitForCompletionWithTimeout(requestNonce, baseline, this.authLoginTimeoutMs);
  }

  private async waitForCompletionWithTimeout<TData>(
    requestNonce: string,
    baseline: Date,
    timeoutMs: number,
  ): Promise<PtuneSyncStatusEnvelope<TData>> {
    return this.waitFor(requestNonce, baseline, timeoutMs, (envelope) =>
      envelope.phase === "completed"
      || envelope.status === "success"
      || envelope.status === "error");
  }

  private async waitFor<TData>(
    requestNonce: string,
    baseline: Date,
    timeoutMs: number,
    predicate: (envelope: PtuneSyncStatusEnvelope<TData>) => boolean,
  ): Promise<PtuneSyncStatusEnvelope<TData>> {
    const timeoutAt = Date.now() + timeoutMs;

    while (Date.now() < timeoutAt) {
      const envelope = await this.tryRead<TData>(requestNonce);
      if (!envelope || !this.isNewer(envelope, baseline) || !this.matchesRequest(envelope, requestNonce)) {
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

  private async tryRead<TData>(requestNonce: string): Promise<PtuneSyncStatusEnvelope<TData> | null> {
    const path = this.workDir.getStatusFileRelative();

    if (!(await this.app.vault.adapter.exists(path))) {
      return null;
    }

    try {
      const raw = await this.app.vault.adapter.read(path);
      const envelope = PtuneSyncStatusParser.parse<TData>(raw);
      logger.debug(
        `[Sync] [PtuneTaskStatusWatcher] requestNonce=${requestNonce} envelopeNonce=${envelope.request_nonce ?? "<none>"} phase=${envelope.phase ?? "<none>"} status=${envelope.status}`,
      );
      return envelope;
    } catch {
      return null;
    }
  }

  private matchesRequest(envelope: PtuneSyncStatusEnvelope, requestNonce: string): boolean {
    if (envelope.request_nonce) {
      return envelope.request_nonce === requestNonce;
    }

    return !envelope.request_id || envelope.request_id === requestNonce;
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
