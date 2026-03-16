import { ReviewOutputFormat } from "../../../config/types";

export type ReviewFlowOptions = {
  taskReviewEnabledDefault: boolean;
  notesReviewEnabledDefault: boolean;
  taskReviewOutputFormat: ReviewOutputFormat;
  noteSummaryOutputFormat: ReviewOutputFormat;
};
