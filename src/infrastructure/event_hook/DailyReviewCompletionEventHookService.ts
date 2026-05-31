import { homedir } from "os";
import { dirname, join } from "path";
import { mkdir, readFile, rename } from "fs/promises";
import { config } from "../../config/config";

type ReviewAppliedNotification = {
  event_type?: string;
  request_id?: string;
  payload?: {
    scope?: string;
    batch_id?: string;
    dailynote_key?: string;
    report_generation_requested?: boolean;
    applied_count?: number;
  };
};

export class DailyReviewCompletionEventHookService {
  async waitForDailyReviewApplied(options: {
    requestId: string;
    date: string;
  }): Promise<{
    appliedCount: number;
    reportGenerationRequested: boolean;
  } | null> {
    const outboxPath = this.resolveNotificationOutboxFile(options.requestId);

    for (;;) {
      try {
        const raw = await readFile(outboxPath, "utf-8");
        const parsed = JSON.parse(raw) as ReviewAppliedNotification;
        if (
          parsed.event_type === "review.applied" &&
          parsed.payload?.scope === "daily" &&
          parsed.payload?.batch_id === options.requestId &&
          parsed.payload?.dailynote_key === options.date
        ) {
          await this.archiveNotification(outboxPath, options.requestId);
          return {
            appliedCount: this.toInt(parsed.payload?.applied_count),
            reportGenerationRequested: parsed.payload?.report_generation_requested !== false,
          };
        }
      } catch {
        // continue polling
      }
      await this.delay(500);
    }
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

  private toInt(value: unknown): number {
    if (typeof value === "number" && Number.isFinite(value)) {
      return Math.trunc(value);
    }
    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number.parseInt(value, 10);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    return 0;
  }

  private async delay(ms: number): Promise<void> {
    await new Promise<void>((resolve) => window.setTimeout(resolve, ms));
  }
}
