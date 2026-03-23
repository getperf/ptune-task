export type SetupItemId =
  | "note_resources"
  | "daily_notes"
  | "ptunesync"
  | "calendar"
  | "outliner"
  | "bases";

export type SetupItemLevel = "required" | "recommended";

export type SetupItemStatus = "ok" | "missing" | "warning" | "skipped";

export type SetupItem = {
  id: SetupItemId;
  title: string;
  level: SetupItemLevel;
  status: SetupItemStatus;
  message: string;
  actionUrl?: string;
};

export type SetupChecklist = {
  required: SetupItem[];
  recommended: SetupItem[];
};
