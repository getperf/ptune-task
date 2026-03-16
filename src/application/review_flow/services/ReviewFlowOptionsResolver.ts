import { config } from "../../../config/config";
import { ReviewFlowOptions } from "../types/ReviewFlowOptions";

export class ReviewFlowOptionsResolver {
  resolve(): ReviewFlowOptions {
    return {
      taskReviewEnabledDefault: config.settings.review.taskReviewEnabledDefault,
      notesReviewEnabledDefault: config.settings.review.notesReviewEnabledDefault,
      noteSummaryOutputFormat: config.settings.review.noteSummaryOutputFormat,
      taskReviewOutputFormat: config.settings.review.taskReviewOutputFormat,
    };
  }
}
