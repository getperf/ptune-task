import { PtuneSyncCommandResult } from "./PtuneSyncCommandResult";
import { PtuneSyncStatusDto } from "./PtuneSyncStatusDto";

export class PtuneSyncCommandResultMapper {
  static fromDto<TData>(dto: PtuneSyncStatusDto<TData>): PtuneSyncCommandResult<TData> {
    return {
      ok: dto.success ?? dto.status === "success",
      data: dto.data,
      errorMessage: dto.error?.message,
      status: dto.status,
      raw: dto,
    };
  }
}
