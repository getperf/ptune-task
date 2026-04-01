import { PtuneSyncStatusDto } from "./PtuneSyncStatusDto";

export type PtuneSyncRunPhase =
  | "created"
  | "accepted"
  | "running"
  | "completed"
  | "unknown";

export interface PtuneSyncRunState<TData = unknown> {
  status: "running" | "success" | "error";
  phase: PtuneSyncRunPhase;
  requestNonce?: string;
  requestId?: string;
  updatedAt: string;
  data?: TData;
  errorMessage?: string;
  raw: PtuneSyncStatusDto<TData>;
}
