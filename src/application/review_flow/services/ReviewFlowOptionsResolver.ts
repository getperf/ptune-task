import { ReviewFlowOptions } from "../types/ReviewFlowOptions";

export class ReviewFlowOptionsResolver {
  resolve(): ReviewFlowOptions {
    return {
      taskReviewEnabledDefault: true,
      notesReviewEnabledDefault: true,
    };
  }
}
