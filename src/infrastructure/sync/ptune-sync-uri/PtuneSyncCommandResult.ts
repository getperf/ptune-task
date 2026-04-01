import { PtuneSyncStatusDto } from "./PtuneSyncStatusDto";

export interface PtuneSyncCommandResult<TData = unknown> {
  ok: boolean;
  data?: TData;
  errorMessage?: string;
  status: "running" | "success" | "error";
  raw: PtuneSyncStatusDto<TData>;
}
