import { PullQuery } from "../../../application/sync/shared/dto/PullQuery";
import { PushQuery } from "../../../application/sync/shared/dto/PushQuery";
import { ReviewQuery } from "../../../application/sync/shared/dto/ReviewQuery";
import { PtuneSyncStatusDto } from "../ptune-sync-uri/PtuneSyncStatusDto";

export interface PtuneSyncClient {
  authStatus<TData>(): Promise<PtuneSyncStatusDto<TData>>;
  authLogin<TData>(): Promise<PtuneSyncStatusDto<TData>>;
  pull<TData>(query: PullQuery): Promise<PtuneSyncStatusDto<TData>>;
  review<TData>(query: ReviewQuery): Promise<PtuneSyncStatusDto<TData>>;
  diff<TData>(
    payload: string,
    query: PushQuery,
  ): Promise<PtuneSyncStatusDto<TData>>;
  push<TData>(
    payload: string,
    query: PushQuery,
  ): Promise<PtuneSyncStatusDto<TData>>;
}
