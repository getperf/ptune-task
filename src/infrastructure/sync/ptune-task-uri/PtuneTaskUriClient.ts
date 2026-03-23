import { PullQuery } from "../../../application/sync/shared/dto/PullQuery";
import { PushQuery } from "../../../application/sync/shared/dto/PushQuery";
import { ReviewQuery } from "../../../application/sync/shared/dto/ReviewQuery";
import { logger } from "../../../shared/logger/loggerInstance";
import { PtuneSyncStatusEnvelope } from "../ptune-sync-uri/PtuneSyncStatusEnvelope";
import { PtuneSyncUriClient } from "../ptune-sync-uri/PtuneSyncUriClient";
import { PtuneSyncClient } from "../shared/PtuneSyncClient";

export class PtuneTaskUriClient implements PtuneSyncClient {
  constructor(private readonly client: PtuneSyncUriClient) {}

  authStatus<TData>(): Promise<PtuneSyncStatusEnvelope<TData>> {
    logger.debug("[Sync] [PtuneTaskUriClient] authStatus delegated to legacy URI client");
    return this.client.authStatus<TData>();
  }

  authLogin<TData>(): Promise<PtuneSyncStatusEnvelope<TData>> {
    logger.debug("[Sync] [PtuneTaskUriClient] authLogin delegated to legacy URI client");
    return this.client.authLogin<TData>();
  }

  pull<TData>(query: PullQuery): Promise<PtuneSyncStatusEnvelope<TData>> {
    logger.debug("[Sync] [PtuneTaskUriClient] pull delegated to legacy URI client");
    return this.client.pull<TData>(query);
  }

  review<TData>(query: ReviewQuery): Promise<PtuneSyncStatusEnvelope<TData>> {
    logger.debug("[Sync] [PtuneTaskUriClient] review delegated to legacy URI client");
    return this.client.review<TData>(query);
  }

  diff<TData>(
    payload: string,
    query: PushQuery,
  ): Promise<PtuneSyncStatusEnvelope<TData>> {
    logger.debug("[Sync] [PtuneTaskUriClient] diff delegated to legacy URI client");
    return this.client.diff<TData>(payload, query);
  }

  push<TData>(
    payload: string,
    query: PushQuery,
  ): Promise<PtuneSyncStatusEnvelope<TData>> {
    logger.debug("[Sync] [PtuneTaskUriClient] push delegated to legacy URI client");
    return this.client.push<TData>(payload, query);
  }
}
