// src/presentation/commands/ReviewCommand.ts

import { TodayResolver } from "../../application/calendar/services/TodayResolver";
import { DailyReviewFlowResult } from "../../application/review_flow/types/DailyReviewFlowResult";
import { GenerateDailyReviewFlowUseCase } from "../../application/review_flow/usecases/GenerateDailyReviewFlowUseCase";
import { logger } from "../../shared/logger/loggerInstance";
import { DailyNote } from "../../domain/daily/DailyNote";

export interface ReviewPresenter {
  openNote(note: DailyNote): Promise<void>;
  refreshCalendar(): Promise<void>;
  showInfo(message: string): void;
  showError(message: string): void;
  saveActiveEditor(): Promise<void>;
}

export class ReviewCommand {
  constructor(
    private readonly todayResolver: TodayResolver,
    private readonly useCase: GenerateDailyReviewFlowUseCase,
    private readonly presenter: ReviewPresenter,
  ) { }

  async execute(): Promise<void> {
    const date = this.todayResolver.resolve();
    logger.info(`[Command] ReviewCommand started date=${date}`);

    try {
      await this.presenter.saveActiveEditor();

      const result = await this.useCase.execute(date);

      await this.presenter.openNote(result.note);
      await this.presenter.refreshCalendar();

      this.presenter.showInfo(this.buildMessage(result));

      logger.info(`[Command] ReviewCommand completed date=${date}`);
    } catch (err) {
      logger.error(`[Command] ReviewCommand failed date=${date}`, err);
      this.presenter.showError(String(err));
    }
  }

  private buildMessage(result: DailyReviewFlowResult): string {
    if (!result.dailyNotesReview.executed) {
      return `Review generated (${result.taskReview.taskCount} tasks, notes review skipped: ${result.dailyNotesReview.skippedReason})`;
    }

    return `Review generated (${result.taskReview.taskCount} tasks, notes ${result.dailyNotesReview.noteCount}/${result.dailyNotesReview.generatedCount})`;
  }
}
