import { config } from "../../../config/config";
import { ReviewFlowOptions } from "../types/ReviewFlowOptions";

export class ReviewFlowOptionsResolver {
  resolve(): ReviewFlowOptions {
    return {
      notesReviewEnabled: config.settings.review.notesReviewEnabled,
      taskReviewOutputFormat: config.settings.review.taskReviewOutputFormat,
    };
  }
}
