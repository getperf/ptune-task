import { homedir } from "os";
import { dirname, join } from "path";
import { mkdir, readFile, rename } from "fs/promises";
import { config } from "../../config/config";

export type NoteReviewOutcome = "completed" | "skipped" | "failed" | "timeout";

export type NoteReviewCompletionResult = {
  outcome: NoteReviewOutcome;
  message: string;
};

type NoteReviewCompletedNotification = {
  schema_version?: number;
  event_type?: string;
  request_id?: string;
  payload?: {
    scope?: string;
    note_path?: string;
    vault_path?: string;
    outcome?: string;
    message?: string;
  };
};

// A note-review backfill runs an LLM summary, so it can take a while. Poll
// until the daemon publishes the terminal or this budget elapses. Bounded (no
// infinite loop); a timeout yields a "timeout" outcome, never a hang.
const DEFAULT_TIMEOUT_MS = 5 * 60 * 1000;
const POLL_INTERVAL_MS = 500;
// Notification envelope contract shared with ptune-log. A drift here must fail
// loudly rather than silently poll until the timeout budget is exhausted.
const SUPPORTED_NOTIFICATION_SCHEMA_VERSION = 1;

export class NoteReviewCompletionEventHookService {
  async waitForNoteReviewCompleted(options: {
    requestId: string;
    notePath: string;
  }): Promise<NoteReviewCompletionResult> {
    const outboxPath = this.resolveNotificationOutboxFile(options.requestId);
    const deadline = Date.now() + DEFAULT_TIMEOUT_MS;

    for (;;) {
      try {
        const raw = await readFile(outboxPath, "utf-8");
        const parsed = JSON.parse(raw) as NoteReviewCompletedNotification;
        if (
          parsed.event_type === "note-review-completed" &&
          parsed.request_id === options.requestId
        ) {
          await this.archiveNotification(outboxPath, options.requestId);
          // The terminal matched this request. Validate the contract now so an
          // unexpected schema_version surfaces as a failure instead of a hang.
          if (!this.isSupportedSchemaVersion(parsed.schema_version)) {
            return {
              outcome: "failed",
              message: `unsupported note-review notification schema_version: ${String(parsed.schema_version)}`,
            };
          }
          return {
            outcome: this.normalizeOutcome(parsed.payload?.outcome),
            message:
              typeof parsed.payload?.message === "string"
                ? parsed.payload.message
                : "",
          };
        }
      } catch {
        // continue polling
      }
      if (Date.now() >= deadline) {
        return { outcome: "timeout", message: "" };
      }
      await this.delay(POLL_INTERVAL_MS);
    }
  }

  private isSupportedSchemaVersion(value: unknown): boolean {
    // Tolerate an absent field for backward compatibility; only an explicit
    // mismatch is treated as a contract drift.
    if (value === undefined) {
      return true;
    }
    return value === SUPPORTED_NOTIFICATION_SCHEMA_VERSION;
  }

  private normalizeOutcome(value: unknown): NoteReviewOutcome {
    if (value === "completed" || value === "skipped" || value === "failed") {
      return value;
    }
    return "failed";
  }

  private resolveInteropRoot(): string {
    const configured = config.settings.eventHook.interopRoot.trim();
    if (configured) {
      return configured;
    }
    return join(homedir(), ".ptune", "interop");
  }

  private resolveNotificationOutboxFile(requestId: string): string {
    return join(
      this.resolveInteropRoot(),
      "notifications",
      "outbox",
      `${requestId}.json`,
    );
  }

  private async archiveNotification(sourcePath: string, requestId: string): Promise<void> {
    const processedPath = join(
      this.resolveInteropRoot(),
      "notifications",
      "processed",
      `${requestId}.json`,
    );
    await mkdir(dirname(processedPath), { recursive: true });
    try {
      await rename(sourcePath, processedPath);
    } catch {
      // Ignore archive failures. The notification has already been consumed.
    }
  }

  private async delay(ms: number): Promise<void> {
    await new Promise<void>((resolve) => window.setTimeout(resolve, ms));
  }
}
