export interface PtuneSyncStatusError {
  type: string;
  message: string;
}

export interface PtuneSyncStatusEnvelope<TData = unknown> {
  version: number;
  timestamp: string;
  status: "running" | "success" | "error";
  success?: boolean;
  command?: string;
  request_id?: string;
  phase?: "created" | "accepted" | "running" | "completed";
  updated_at?: string;
  data?: TData;
  error?: PtuneSyncStatusError;
  meta?: Record<string, unknown>;
}
