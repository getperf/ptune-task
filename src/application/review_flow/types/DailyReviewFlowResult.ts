import { DailyNote } from "../../../domain/daily/DailyNote";

export type DailyNotesReviewSkippedReason = "disabled" | "llm-unavailable";

export type DailyReviewOutcome = "completed" | "cancelled" | "failed" | "timeout";

export type DailyReviewFlowResult = {
  note: DailyNote;
  taskReview:
    | {
        executed: true;
        taskCount: number;
      }
    | {
        executed: false;
        taskCount: 0;
      };
  dailyNotesReview:
    | {
        executed: true;
        noteCount: number;
        requestedExternally?: boolean;
        outcome?: DailyReviewOutcome;
      }
    | {
        executed: false;
        noteCount: 0;
        skippedReason: DailyNotesReviewSkippedReason;
      };
};
