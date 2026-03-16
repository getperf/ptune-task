import { logger } from "../../../shared/logger/loggerInstance";
import { GenerateDailyNotesReviewUseCase } from "../../daily_notes_review/usecases/GenerateDailyNotesReviewUseCase";
import { TextGenerationPort } from "../../llm/ports/TextGenerationPort";
import { GenerateDailyReviewUseCase } from "../../review/usecases/GenerateDailyReviewUseCase";
import { getDefaultTaskListId } from "../../sync/shared/DefaultTaskListId";
import { ReviewFlowOptionsResolver } from "../services/ReviewFlowOptionsResolver";
import { DailyReviewFlowResult } from "../types/DailyReviewFlowResult";

export class GenerateDailyReviewFlowUseCase {
  constructor(
    private readonly taskReviewUseCase: GenerateDailyReviewUseCase,
    private readonly dailyNotesReviewUseCase: GenerateDailyNotesReviewUseCase,
    private readonly optionsResolver: ReviewFlowOptionsResolver,
    private readonly textGenerator: TextGenerationPort,
  ) {}

  async execute(date: string): Promise<DailyReviewFlowResult> {
    logger.debug(`[UseCase:start] GenerateDailyReviewFlowUseCase date=${date}`);

    try {
      const options = this.optionsResolver.resolve();
      logger.debug(
        `[UseCase] GenerateDailyReviewFlowUseCase options date=${date} notesReviewEnabled=${options.notesReviewEnabled} taskReviewOutputFormat=${options.taskReviewOutputFormat}`,
      );

      const taskReviewResult = await this.taskReviewUseCase.execute(getDefaultTaskListId());

      if (!options.notesReviewEnabled) {
        logger.debug(
          `[UseCase:end] GenerateDailyReviewFlowUseCase date=${date} taskCount=${taskReviewResult.taskCount} notesReview=skipped reason=disabled`,
        );

        return {
          note: taskReviewResult.note,
          taskReview: {
            executed: true,
            taskCount: taskReviewResult.taskCount,
          },
          dailyNotesReview: {
            executed: false,
            noteCount: 0,
            generatedCount: 0,
            skippedReason: "disabled",
          },
        };
      }

      if (!this.textGenerator.hasValidApiKey()) {
        logger.debug(
          `[UseCase:end] GenerateDailyReviewFlowUseCase date=${date} taskCount=${taskReviewResult.taskCount} notesReview=skipped reason=llm-unavailable`,
        );

        return {
          note: taskReviewResult.note,
          taskReview: {
            executed: true,
            taskCount: taskReviewResult.taskCount,
          },
          dailyNotesReview: {
            executed: false,
            noteCount: 0,
            generatedCount: 0,
            skippedReason: "llm-unavailable",
          },
        };
      }

      const dailyNotesReviewResult = await this.dailyNotesReviewUseCase.execute(date);

      logger.debug(
        `[UseCase:end] GenerateDailyReviewFlowUseCase date=${date} taskCount=${taskReviewResult.taskCount} noteCount=${dailyNotesReviewResult.noteCount} generated=${dailyNotesReviewResult.generatedCount}`,
      );

      return {
        note: dailyNotesReviewResult.note ?? taskReviewResult.note,
        taskReview: {
          executed: true,
          taskCount: taskReviewResult.taskCount,
        },
        dailyNotesReview: {
          executed: true,
          noteCount: dailyNotesReviewResult.noteCount,
          generatedCount: dailyNotesReviewResult.generatedCount,
        },
      };
    } catch (error) {
      logger.warn(
        `[UseCase] GenerateDailyReviewFlowUseCase failed date=${date} message=${this.resolveErrorMessage(error)}`,
        error,
      );
      throw error;
    }
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
}
