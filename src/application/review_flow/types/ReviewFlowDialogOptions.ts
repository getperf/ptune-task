export type ReviewFlowDialogOptions = {
  date: string;
  dateCandidates: string[];
  taskReviewEnabled: boolean;
  dailyNotesReviewEnabled: boolean;
  // false when the ptune-log event hook is disabled: daily notes review cannot
  // run, so the toggle is shown disabled and forced off.
  notesReviewAvailable: boolean;
};
