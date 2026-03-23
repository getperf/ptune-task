import { PullQuery } from "../../../application/sync/shared/dto/PullQuery";
import { PushQuery } from "../../../application/sync/shared/dto/PushQuery";
import { ReviewQuery } from "../../../application/sync/shared/dto/ReviewQuery";
import { PtuneSyncStatusEnvelope } from "../ptune-sync-uri/PtuneSyncStatusEnvelope";

export interface PtuneSyncClient {
  authStatus<TData>(): Promise<PtuneSyncStatusEnvelope<TData>>;
  authLogin<TData>(): Promise<PtuneSyncStatusEnvelope<TData>>;
  pull<TData>(query: PullQuery): Promise<PtuneSyncStatusEnvelope<TData>>;
  review<TData>(query: ReviewQuery): Promise<PtuneSyncStatusEnvelope<TData>>;
  diff<TData>(
    payload: string,
    query: PushQuery,
  ): Promise<PtuneSyncStatusEnvelope<TData>>;
  push<TData>(
    payload: string,
    query: PushQuery,
  ): Promise<PtuneSyncStatusEnvelope<TData>>;
}
