import { PtuneSyncRunState } from "./PtuneSyncRunState";
import { PtuneSyncStatusDto } from "./PtuneSyncStatusDto";

export class PtuneSyncRunStateMapper {
  static fromDto<TData>(dto: PtuneSyncStatusDto<TData>): PtuneSyncRunState<TData> {
    return {
      status: dto.status,
      phase: dto.phase ?? "unknown",
      requestNonce: dto.request_nonce,
      requestId: dto.request_id,
      updatedAt: dto.updated_at ?? dto.timestamp,
      data: dto.data,
      errorMessage: dto.error?.message,
      raw: dto,
    };
  }
}
