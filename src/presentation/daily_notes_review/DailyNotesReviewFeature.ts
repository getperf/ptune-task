import { App, Notice, Plugin } from "obsidian";
import { TodayResolver } from "../../application/calendar/services/TodayResolver";
import { GenerateDailyNotesReviewUseCase } from "../../application/daily_notes_review/usecases/GenerateDailyNotesReviewUseCase";
import { TextGenerationPort } from "../../application/llm/ports/TextGenerationPort";
import { i18n } from "../../shared/i18n/I18n";
import { logger } from "../../shared/logger/loggerInstance";
import { DailyNotesReviewModal } from "./DailyNotesReviewModal";

export class DailyNotesReviewFeature {
  constructor(
    private readonly app: App,
    private readonly textGenerator: TextGenerationPort,
    private readonly todayResolver: TodayResolver,
    private readonly useCase: GenerateDailyNotesReviewUseCase,
  ) {}

  start(plugin: Plugin): void {
    plugin.addCommand({
      id: "daily-notes-review",
      name: i18n.common.dailyNotesReview.command.run,
      callback: () => {
        this.openModal();
      },
    });
  }

  private openModal(): void {
    if (!this.textGenerator.hasValidApiKey()) {
      new Notice(i18n.common.dailyNotesReview.notice.apiKeyNotSet);
      return;
    }

    new DailyNotesReviewModal(
      this.app,
      this.todayResolver.resolve(),
      async (date) => {
        try {
          const result = await this.useCase.execute(date);

          if (result.noteCount === 0) {
            new Notice(i18n.common.dailyNotesReview.notice.noNotes);
            return;
          }

          new Notice(
            `${i18n.common.dailyNotesReview.notice.completed} (${result.noteCount}/${result.generatedCount})`,
          );
        } catch (error) {
          const message = this.resolveErrorMessage(error);
          logger.warn(`[Command] DailyNotesReviewFeature.run failed message=${message || "unknown"}`, error);
          new Notice(
            message
              ? `${i18n.common.dailyNotesReview.notice.failed}: ${message}`
              : i18n.common.dailyNotesReview.notice.failed,
          );
        }
      },
    ).open();
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === "string") {
      return error;
    }

    return "";
  }
}
