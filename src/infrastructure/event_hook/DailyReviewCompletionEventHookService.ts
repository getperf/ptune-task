import { homedir } from "os";
import { dirname, join } from "path";
import { mkdir, readFile, rename } from "fs/promises";
import { config } from "../../config/config";

export type DailyReviewOutcome = "completed" | "cancelled" | "failed" | "timeout";

export type DailyReviewCompletionResult = {
  outcome: DailyReviewOutcome;
  reportSaved: boolean;
  message: string;
};

type DailyReviewCompletedNotification = {
  schema_version?: number;
  event_type?: string;
  request_id?: string;
  payload?: {
    scope?: string;
    dailynote_key?: string;
    outcome?: string;
    report_saved?: boolean;
    message?: string;
  };
};

// A human review can take a while, so poll until the daemon publishes the
// terminal or this budget elapses. Bounded (no infinite loop).
const DEFAULT_TIMEOUT_MS = 60 * 60 * 1000;
const POLL_INTERVAL_MS = 500;
// Notification envelope contract shared with ptune-log. A drift here must fail
// loudly rather than silently poll until the timeout budget is exhausted.
const SUPPORTED_NOTIFICATION_SCHEMA_VERSION = 1;

export class DailyReviewCompletionEventHookService {
  async waitForDailyReviewCompleted(options: {
    requestId: string;
    date: string;
  }): Promise<DailyReviewCompletionResult> {
    const outboxPath = this.resolveNotificationOutboxFile(options.requestId);
    const deadline = Date.now() + DEFAULT_TIMEOUT_MS;

    for (;;) {
      try {
        const raw = await readFile(outboxPath, "utf-8");
        const parsed = JSON.parse(raw) as DailyReviewCompletedNotification;
        if (
          parsed.event_type === "daily-review-completed" &&
          parsed.request_id === options.requestId &&
          parsed.payload?.dailynote_key === options.date
        ) {
          await this.archiveNotification(outboxPath, options.requestId);
          // The terminal matched this request. Validate the contract now so an
          // unexpected schema_version surfaces as a failure instead of a hang.
          if (!this.isSupportedSchemaVersion(parsed.schema_version)) {
            return {
              outcome: "failed",
              reportSaved: false,
              message: `unsupported daily-review notification schema_version: ${String(parsed.schema_version)}`,
            };
          }
          return {
            outcome: this.normalizeOutcome(parsed.payload?.outcome),
            reportSaved: parsed.payload?.report_saved === true,
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
        return { outcome: "timeout", reportSaved: false, message: "" };
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

  private normalizeOutcome(value: unknown): DailyReviewOutcome {
    if (value === "completed" || value === "cancelled" || value === "failed") {
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
