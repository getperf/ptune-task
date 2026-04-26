import { App } from "obsidian";
import { TodayResolver } from "../../application/calendar/services/TodayResolver";
import { DailyReviewFlowProgressEvent } from "../../application/review_flow/types/DailyReviewFlowProgressEvent";
import { DailyReviewFlowResult } from "../../application/review_flow/types/DailyReviewFlowResult";
import { ReviewFlowDialogOptions } from "../../application/review_flow/types/ReviewFlowDialogOptions";
import { ReviewFlowRunOptions } from "../../application/review_flow/types/ReviewFlowRunOptions";
import { GenerateDailyReviewFlowUseCase } from "../../application/review_flow/usecases/GenerateDailyReviewFlowUseCase";
import { ReviewFlowOptionsResolver } from "../../application/review_flow/services/ReviewFlowOptionsResolver";
import { config } from "../../config/config";
import { EventHookService } from "../../infrastructure/event_hook/EventHookService";
import { PythonReviewConfigSyncService } from "../../infrastructure/review/PythonReviewConfigSyncService";
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
  private static readonly DAILY_REVIEW_APPLY_WAIT_MS = 60 * 60 * 1000;

  constructor(
    private readonly todayResolver: TodayResolver,
    private readonly optionsResolver: ReviewFlowOptionsResolver,
    private readonly useCase: GenerateDailyReviewFlowUseCase,
    private readonly presenter: ReviewPresenter,
    private readonly eventHookService: EventHookService,
    private readonly reviewConfigSyncService: PythonReviewConfigSyncService,
  ) { }

  execute(): void {
    const today = this.todayResolver.resolve();
    const defaults = this.optionsResolver.resolve();
    const dialogOptions: ReviewFlowDialogOptions = {
      date: today,
      dateCandidates: this.buildRecentDates(today, 7),
      taskReviewEnabled: defaults.taskReviewEnabledDefault,
      dailyNotesReviewEnabled: defaults.notesReviewEnabledDefault,
      reviewPointOutputFormat: defaults.reviewPointOutputFormat,
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
      const result = this.shouldRunDailyReviewViaHook(options)
        ? await this.runWithHookAndTaskFirst(options, progress)
        : await this.useCase.execute(
          options,
          (event: DailyReviewFlowProgressEvent) => {
            progress.handleEvent(event);
          },
        );

      await this.presenter.openNote(result.note);
      await this.presenter.refreshCalendar();

      progress.markCompleted();
      this.presenter.showInfo(this.buildMessage(result));

      logger.info(`[Command] ReviewCommand completed date=${options.date}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      progress.markFailed(message);
      logger.error(`[Command] ReviewCommand failed date=${options.date}`, err);
    }
  }

  private shouldRunDailyReviewViaHook(options: ReviewFlowRunOptions): boolean {
    return config.settings.eventHook.enabled && options.dailyNotesReviewEnabled;
  }

  private async runWithHookAndTaskFirst(
    options: ReviewFlowRunOptions,
    progress: ReviewProgressController,
  ): Promise<DailyReviewFlowResult> {
    const events = i18n.common.reviewFlow.progress.events;
    const externalReviewPromise = this.runDailyReviewViaHook(options, progress);

    let taskResult: DailyReviewFlowResult | null = null;
    if (options.taskReviewEnabled) {
      progress.appendStatusLine(events.taskReviewParallelStart);
      const taskReviewOptions: ReviewFlowRunOptions = {
        ...options,
        dailyNotesReviewEnabled: false,
      };
      taskResult = await this.useCase.execute(taskReviewOptions, (event: DailyReviewFlowProgressEvent) => {
        progress.handleEvent(event);
      });
    }

    await externalReviewPromise;
    progress.appendStatusLine(events.dailyNotesReviewAfterExternal);
    const noteReviewOptions: ReviewFlowRunOptions = {
      ...options,
      taskReviewEnabled: false,
      dailyNotesReviewEnabled: true,
      skipExternalDailyReviewRequest: true,
    };
    const noteResult = await this.useCase.execute(noteReviewOptions, (event: DailyReviewFlowProgressEvent) => {
      progress.handleEvent(event);
    });

    if (!taskResult) {
      return noteResult;
    }

    return {
      note: noteResult.note ?? taskResult.note,
      taskReview: taskResult.taskReview,
      dailyNotesReview: noteResult.dailyNotesReview,
    };
  }

  private async runDailyReviewViaHook(
    options: ReviewFlowRunOptions,
    progress: ReviewProgressController,
  ): Promise<void> {
    const t = i18n.common.reviewFlow.progress.events;
    progress.appendStatusLine(`${t.externalReviewRequested}: ${options.date}`);
    const synced = await this.reviewConfigSyncService.sync();
    const emitResult = await this.eventHookService.emitDailyReviewRequested(
      options.date,
      {
        profiles_file: synced.profilesFile,
        credentials_file: synced.credentialsFile,
        profile_id: synced.profileId,
        dailynote_key: options.date,
      },
    );
    if (emitResult.status === "error" || emitResult.status === "skipped") {
      throw new Error(emitResult.message || "daily-review-requested failed");
    }
    progress.appendStatusLine(`${t.externalReviewAccepted}: ${emitResult.requestId}`);
    if (emitResult.status === "timeout") {
      progress.appendStatusLine(t.externalReviewStatusTimeout);
    }
    progress.appendStatusLine(t.externalReviewWaiting);
    const notification = await this.eventHookService.waitForDailyReviewApplied(
      emitResult.requestId,
      ReviewCommand.DAILY_REVIEW_APPLY_WAIT_MS,
    );
    if (!notification) {
      throw new Error(t.externalReviewApplyTimeout);
    }
    progress.appendStatusLine(
      `${t.externalReviewApplied}: applied=${notification.appliedCount} failed=${notification.failedCount}`,
    );
  }

  private buildMessage(result: DailyReviewFlowResult): string {
    const t = i18n.common.reviewCommand.notice;
    if (!result.dailyNotesReview.executed) {
      return t.generatedWithoutNotesReview
        .replace("{taskCount}", String(result.taskReview.taskCount))
        .replace("{reason}", result.dailyNotesReview.skippedReason);
    }

    if (result.dailyNotesReview.requestedExternally === true) {
      return t.dailyNotesReviewRequested
        .replace("{taskCount}", String(result.taskReview.taskCount));
    }

    return t.generated
      .replace("{taskCount}", String(result.taskReview.taskCount))
      .replace("{noteCount}", String(result.dailyNotesReview.noteCount))
      .replace("{generatedCount}", String(result.dailyNotesReview.generatedCount));
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
