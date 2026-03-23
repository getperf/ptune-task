import { PullQuery } from "../../../application/sync/shared/dto/PullQuery";
import { PushQuery } from "../../../application/sync/shared/dto/PushQuery";
import { ReviewQuery } from "../../../application/sync/shared/dto/ReviewQuery";
import { PtuneSyncStatusEnvelope } from "../ptune-sync-uri/PtuneSyncStatusEnvelope";
import { PtuneSyncUriClient } from "../ptune-sync-uri/PtuneSyncUriClient";
import { PtuneSyncClient } from "../shared/PtuneSyncClient";

export class PtuneSyncSkelUriClient implements PtuneSyncClient {
  constructor(private readonly client: PtuneSyncUriClient) {}

  authStatus<TData>(): Promise<PtuneSyncStatusEnvelope<TData>> {
    return this.client.authStatus<TData>();
  }

  authLogin<TData>(): Promise<PtuneSyncStatusEnvelope<TData>> {
    return this.client.authLogin<TData>();
  }

  pull<TData>(query: PullQuery): Promise<PtuneSyncStatusEnvelope<TData>> {
    return this.client.pull<TData>(query);
  }

  review<TData>(query: ReviewQuery): Promise<PtuneSyncStatusEnvelope<TData>> {
    return this.client.review<TData>(query);
  }

  diff<TData>(
    payload: string,
    query: PushQuery,
  ): Promise<PtuneSyncStatusEnvelope<TData>> {
    return this.client.diff<TData>(payload, query);
  }

  push<TData>(
    payload: string,
    query: PushQuery,
  ): Promise<PtuneSyncStatusEnvelope<TData>> {
    return this.client.push<TData>(payload, query);
  }
}
