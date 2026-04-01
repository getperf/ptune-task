export interface PtuneSyncStatusErrorDto {
  type: string;
  message: string;
}

export interface PtuneSyncStatusDto<TData = unknown> {
  version: number;
  timestamp: string;
  status: "running" | "success" | "error";
  success?: boolean;
  command?: string;
  request_nonce?: string;
  request_id?: string;
  request_key?: string;
  phase?: "created" | "accepted" | "running" | "completed";
  updated_at?: string;
  data?: TData;
  error?: PtuneSyncStatusErrorDto;
  meta?: Record<string, unknown>;
}
