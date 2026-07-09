import { logger } from "../../../shared/logger/loggerInstance";
import { CreateDailyNoteUseCase } from "../../calendar/usecases/CreateDailyNoteUseCase";
import {
  GenerateDailyNotesReviewUseCase,
  GenerateDailyNotesReviewOptions,
} from "../../daily_notes_review/usecases/GenerateDailyNotesReviewUseCase";
import { TextGenerationPort } from "../../llm/ports/TextGenerationPort";
import { GenerateDailyReviewUseCase } from "../../review/usecases/GenerateDailyReviewUseCase";
import { PullAndMergeTodayUseCase } from "../../sync/pull/PullAndMergeTodayUseCase";
import { getDefaultTaskListId } from "../../sync/shared/DefaultTaskListId";
import { DailyReviewFlowProgressEvent } from "../types/DailyReviewFlowProgressEvent";
import { DailyReviewFlowResult } from "../types/DailyReviewFlowResult";
import { ReviewFlowRunOptions } from "../types/ReviewFlowRunOptions";

export interface DailyReviewRequestPort {
  requestDailyReview(options: {
    date: string;
    reviewPointOutputFormat: ReviewFlowRunOptions["reviewPointOutputFormat"];
  }): Promise<{
    requestId: string;
    status: string;
    message: string;
  } | null>;
}

export interface DailyReviewCompletionPort {
  waitForDailyReviewApplied(options: {
    requestId: string;
    date: string;
  }): Promise<{
    appliedCount: number;
    reportGenerationRequested: boolean;
  } | null>;
}

type ExternalDailyReviewRequestResult = Awaited<
  ReturnType<DailyReviewRequestPort["requestDailyReview"]>
>;

export class GenerateDailyReviewFlowUseCase {
  constructor(
    private readonly pullAndMergeTodayUseCase: PullAndMergeTodayUseCase,
    private readonly taskReviewUseCase: GenerateDailyReviewUseCase,
    private readonly dailyNotesReviewUseCase: GenerateDailyNotesReviewUseCase,
    private readonly createDailyNoteUseCase: CreateDailyNoteUseCase,
    private readonly textGenerator: TextGenerationPort,
    private readonly dailyReviewRequestPort?: DailyReviewRequestPort,
    private readonly dailyReviewCompletionPort?: DailyReviewCompletionPort,
  ) { }

  async execute(
    options: ReviewFlowRunOptions,
    onProgress?: (event: DailyReviewFlowProgressEvent) => void,
  ): Promise<DailyReviewFlowResult> {
    logger.debug(`[UseCase:start] GenerateDailyReviewFlowUseCase date=${options.date}`);

    try {
      onProgress?.({ type: "started", date: options.date });
      logger.debug(`[UseCase] GenerateDailyReviewFlowUseCase options date=${options.date} taskReviewEnabled=${options.taskReviewEnabled} notesReviewEnabled=${options.dailyNotesReviewEnabled} reviewPointFormat=${options.reviewPointOutputFormat}`);

      const shouldRequestExternalDailyReview = this.shouldRequestExternalDailyReview(options);
      let externalDailyReviewRequestPromise: Promise<ExternalDailyReviewRequestResult> | null = null;
      let taskReviewResult: Awaited<ReturnType<GenerateDailyReviewUseCase["execute"]>> | null = null;

      if (options.taskReviewEnabled) {
        onProgress?.({ type: "task_review_started", date: options.date });
        await this.pullAndMergeTodayUseCase.execute();

        if (shouldRequestExternalDailyReview) {
          const preparedTaskReview = await this.taskReviewUseCase.prepare(
            options.date,
            getDefaultTaskListId(),
          );
          externalDailyReviewRequestPromise = this.requestExternalDailyReview(options);
          taskReviewResult = await this.taskReviewUseCase.complete(preparedTaskReview);
        } else {
          taskReviewResult = await this.taskReviewUseCase.execute(
            options.date,
            getDefaultTaskListId(),
          );
        }

        onProgress?.({
          type: "task_review_completed",
          taskCount: taskReviewResult.taskCount,
        });
      } else {
        onProgress?.({ type: "task_review_skipped" });
        if (shouldRequestExternalDailyReview) {
          externalDailyReviewRequestPromise = this.requestExternalDailyReview(options);
        }
      }

      if (!options.dailyNotesReviewEnabled) {
        onProgress?.({ type: "daily_notes_review_skipped", reason: "disabled" });
        logger.debug(
          `[UseCase:end] GenerateDailyReviewFlowUseCase date=${options.date} taskCount=${taskReviewResult?.taskCount ?? 0} notesReview=skipped reason=disabled`,
        );

        return {
          note: taskReviewResult?.note ?? (await this.resolveDailyNote(options.date)),
          taskReview: taskReviewResult
            ? {
              executed: true,
              taskCount: taskReviewResult.taskCount,
            }
            : {
              executed: false,
              taskCount: 0,
            },
          dailyNotesReview: {
            executed: false,
            noteCount: 0,
            generatedCount: 0,
            skippedReason: "disabled",
          },
        };
      }

      if (externalDailyReviewRequestPromise) {
        const externalResult = await this.resolveExternalDailyReview(
          options,
          externalDailyReviewRequestPromise,
          onProgress,
        );
        if (externalResult) {
          const note = taskReviewResult?.note ?? (await this.resolveDailyNote(options.date));
          onProgress?.({ type: "completed" });
          logger.debug(
            `[UseCase:end] GenerateDailyReviewFlowUseCase date=${options.date} taskCount=${taskReviewResult?.taskCount ?? 0} dailyReview=requested requestId=${externalResult.requestId}`,
          );

          return {
            note,
            taskReview: taskReviewResult
              ? {
                executed: true,
                taskCount: taskReviewResult.taskCount,
              }
              : {
                executed: false,
                taskCount: 0,
              },
            dailyNotesReview: {
              executed: true,
              noteCount: 0,
              generatedCount: 0,
              requestedExternally: true,
            },
          };
        }
      }

      const dailyNotesReviewResult = await this.executeDailyNotesReview(
        options,
        onProgress,
        this.textGenerator.hasValidApiKey(),
      );

      logger.debug(
        `[UseCase:end] GenerateDailyReviewFlowUseCase date=${options.date} taskCount=${taskReviewResult?.taskCount ?? 0} noteCount=${dailyNotesReviewResult.noteCount} generated=${dailyNotesReviewResult.generatedCount}`,
      );
      onProgress?.({ type: "completed" });

      return {
        note: dailyNotesReviewResult.note ?? taskReviewResult?.note ?? (await this.resolveDailyNote(options.date)),
        taskReview: taskReviewResult
          ? {
            executed: true,
            taskCount: taskReviewResult.taskCount,
          }
          : {
            executed: false,
            taskCount: 0,
          },
        dailyNotesReview: {
          executed: true,
          noteCount: dailyNotesReviewResult.noteCount,
          generatedCount: dailyNotesReviewResult.generatedCount,
        },
      };
    } catch (error) {
      onProgress?.({
        type: "failed",
        message: this.resolveErrorMessage(error),
      });
      logger.warn(
        `[UseCase] GenerateDailyReviewFlowUseCase failed date=${options.date} message=${this.resolveErrorMessage(error)}`,
        error,
      );
      throw error;
    }
  }

  private shouldRequestExternalDailyReview(options: ReviewFlowRunOptions): boolean {
    return Boolean(
      options.dailyNotesReviewEnabled &&
        !options.skipExternalDailyReviewRequest &&
        this.dailyReviewRequestPort &&
        this.textGenerator.hasValidApiKey(),
    );
  }

  private requestExternalDailyReview(
    options: ReviewFlowRunOptions,
  ): Promise<ExternalDailyReviewRequestResult> {
    if (!this.dailyReviewRequestPort) {
      return Promise.resolve(null);
    }

    return this.dailyReviewRequestPort.requestDailyReview({
      date: options.date,
      reviewPointOutputFormat: options.reviewPointOutputFormat,
    });
  }

  private async resolveExternalDailyReview(
    options: ReviewFlowRunOptions,
    requestPromise: Promise<ExternalDailyReviewRequestResult>,
    onProgress: ((event: DailyReviewFlowProgressEvent) => void) | undefined,
  ): Promise<{ requestId: string } | null> {
    const requested = await requestPromise;
    if (!requested) {
      return null;
    }

    if (requested.status === "error" || requested.status === "skipped") {
      throw new Error(requested.message || "daily-review-requested failed");
    }

    onProgress?.({
      type: "daily_notes_review_started",
      date: options.date,
      targetCount: 0,
    });

    if (this.dailyReviewCompletionPort) {
      await this.dailyReviewCompletionPort.waitForDailyReviewApplied({
        requestId: requested.requestId,
        date: options.date,
      });
    }

    onProgress?.({
      type: "daily_notes_review_completed",
      noteCount: 0,
      generatedCount: 0,
    });

    return { requestId: requested.requestId };
  }

  private resolveErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === "string") {
      return error;
    }

    return "unknown";
  }

  private async resolveDailyNote(date: string) {
    const { note } = await this.createDailyNoteUseCase.execute(date);
    return note;
  }

  private async executeDailyNotesReview(
    options: ReviewFlowRunOptions,
    onProgress: ((event: DailyReviewFlowProgressEvent) => void) | undefined,
    enableSummaries: boolean,
  ) {
    let targetCount = 0;
    const dailyNotesReviewOptions: GenerateDailyNotesReviewOptions = {
      reviewPointOutputFormat: options.reviewPointOutputFormat,
      enableSummaries,
      enableReflection: true,
      onProgress: (progress) => {
        if (progress.type === "targets_resolved") {
          targetCount = progress.total;
          onProgress?.({
            type: "daily_notes_review_started",
            date: options.date,
            targetCount,
          });
          return;
        }

        onProgress?.({
          type: "daily_notes_review_progress",
          completed: progress.completed,
          total: progress.total,
          path: progress.path ?? "",
        });
      },
    };
    const dailyNotesReviewResult = await this.dailyNotesReviewUseCase.execute(
      options.date,
      dailyNotesReviewOptions,
    );
    onProgress?.({
      type: "daily_notes_review_completed",
      noteCount: dailyNotesReviewResult.noteCount,
      generatedCount: dailyNotesReviewResult.generatedCount,
    });
    return dailyNotesReviewResult;
  }
}
