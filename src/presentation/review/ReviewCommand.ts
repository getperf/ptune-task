import { App } from "obsidian";
import { config } from "../../config/config";
import { TodayResolver } from "../../application/calendar/services/TodayResolver";
import { DailyReviewFlowProgressEvent } from "../../application/review_flow/types/DailyReviewFlowProgressEvent";
import { ReviewFlowDialogOptions } from "../../application/review_flow/types/ReviewFlowDialogOptions";
import { ReviewFlowRunOptions } from "../../application/review_flow/types/ReviewFlowRunOptions";
import { GenerateDailyReviewFlowUseCase } from "../../application/review_flow/usecases/GenerateDailyReviewFlowUseCase";
import { ReviewFlowOptionsResolver } from "../../application/review_flow/services/ReviewFlowOptionsResolver";
import { i18n } from "../../shared/i18n/I18n";
import { logger } from "../../shared/logger/loggerInstance";
import { DailyNote } from "../../domain/daily/DailyNote";
import { ReviewProgressController } from "./ReviewProgressController";
import { ReviewSetupModal } from "./ReviewSetupModal";

export interface ReviewPresenter {
  readonly app: App;
  openNote(note: DailyNote): Promise<void>;
  refreshCalendar(): Promise<void>;
  showInfo(message: string): void;
  showError(message: string): void;
  saveActiveEditor(): Promise<void>;
}

export class ReviewCommand {
  constructor(
    private readonly todayResolver: TodayResolver,
    private readonly optionsResolver: ReviewFlowOptionsResolver,
    private readonly useCase: GenerateDailyReviewFlowUseCase,
    private readonly presenter: ReviewPresenter,
  ) { }

  execute(): void {
    const today = this.todayResolver.resolve();
    const defaults = this.optionsResolver.resolve();
    // Daily notes review is delegated to ptune-log via the event hook. When the
    // hook is disabled it cannot run, so the toggle is offered disabled/off.
    const notesReviewAvailable = config.settings.eventHook.enabled;
    const dialogOptions: ReviewFlowDialogOptions = {
      date: today,
      dateCandidates: this.buildRecentDates(today, 7),
      taskReviewEnabled: defaults.taskReviewEnabledDefault,
      dailyNotesReviewEnabled:
        defaults.notesReviewEnabledDefault && notesReviewAvailable,
      notesReviewAvailable,
    };

    new ReviewSetupModal(
      this.presenter.app,
      dialogOptions,
      async (options) => {
        await this.run(options);
      },
    ).open();
  }

  private async run(options: ReviewFlowRunOptions): Promise<void> {
    logger.info(`[Command] ReviewCommand started date=${options.date}`);
    const progress = new ReviewProgressController(this.presenter.app, options.date);
    progress.open();

    try {
      await this.presenter.saveActiveEditor();
      const result = await this.useCase.execute(
        options,
        (event: DailyReviewFlowProgressEvent) => {
          progress.handleEvent(event);
        },
        (cancel) => progress.setCancelAction(cancel),
      );

      await this.presenter.openNote(result.note);
      await this.presenter.refreshCalendar();

      const notice = this.buildNotice(result);
      if (notice.error) {
        // The task review still succeeded, but the delegated work-note review
        // failed or timed out. Surface it instead of a false success.
        progress.markFailed(notice.message);
        this.presenter.showError(notice.message);
      } else {
        progress.markCompleted();
        this.presenter.showInfo(notice.message);
      }

      logger.info(`[Command] ReviewCommand completed date=${options.date} notesReviewError=${notice.error}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      progress.markFailed(message);
      logger.error(`[Command] ReviewCommand failed date=${options.date}`, err);
    }
  }

  private buildNotice(
    result: Awaited<ReturnType<GenerateDailyReviewFlowUseCase["execute"]>>,
  ): { message: string; error: boolean } {
    const t = i18n.common.reviewCommand.notice;
    const taskCount = String(result.taskReview.taskCount);

    if (!result.dailyNotesReview.executed) {
      if (result.dailyNotesReview.skippedReason === "event-hook-disabled") {
        return {
          message: t.generatedTaskOnlyEventHookDisabled.replace("{taskCount}", taskCount),
          error: false,
        };
      }
      return {
        message: t.generatedWithoutNotesReview
          .replace("{taskCount}", taskCount)
          .replace("{reason}", result.dailyNotesReview.skippedReason),
        error: false,
      };
    }

    if (result.dailyNotesReview.requestedExternally === true) {
      // Only failed/timeout terminals are surfaced as errors; a cancelled
      // review is a deliberate user action and needs no extra notice.
      if (result.dailyNotesReview.outcome === "failed") {
        return { message: t.dailyNotesReviewFailed.replace("{taskCount}", taskCount), error: true };
      }
      if (result.dailyNotesReview.outcome === "timeout") {
        return { message: t.dailyNotesReviewTimeout.replace("{taskCount}", taskCount), error: true };
      }
      return {
        message: t.dailyNotesReviewRequested.replace("{taskCount}", taskCount),
        error: false,
      };
    }

    return {
      message: t.generated
        .replace("{taskCount}", taskCount)
        .replace("{noteCount}", String(result.dailyNotesReview.noteCount)),
      error: false,
    };
  }

  private buildRecentDates(today: string, days: number): string[] {
    const result: string[] = [];
    const base = new Date(`${today}T12:00:00`);

    for (let i = 0; i < days; i += 1) {
      const value = new Date(base);
      value.setDate(base.getDate() - i);
      result.push(this.formatDate(value));
    }

    return result;
  }

  private formatDate(date: Date): string {
    const year = String(date.getFullYear());
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}
