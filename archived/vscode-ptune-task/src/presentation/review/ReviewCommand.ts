// src/presentation/commands/ReviewCommand.ts

import { Logger } from "../../shared/logger/Logger";
import { GenerateDailyReviewUseCase } from "../../application/review/usecases/GenerateDailyReviewUseCase";
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
    private readonly useCase: GenerateDailyReviewUseCase,
    private readonly presenter: ReviewPresenter,
  ) { }

  async execute(): Promise<void> {
    const logger = Logger.get();
    logger.info("ReviewCommand started");

    try {
      await this.presenter.saveActiveEditor();

      const result = await this.useCase.execute("_Today");

      await this.presenter.openNote(result.note);
      await this.presenter.refreshCalendar();

      this.presenter.showInfo(
        `Review generated (${result.taskCount} tasks)`,
      );

      logger.info("ReviewCommand completed");
    } catch (err) {
      logger.error("ReviewCommand failed", err);
      this.presenter.showError(String(err));
    }
  }
}