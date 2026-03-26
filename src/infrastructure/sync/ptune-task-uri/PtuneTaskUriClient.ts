import { PullQuery } from "../../../application/sync/shared/dto/PullQuery";
import { PushQuery } from "../../../application/sync/shared/dto/PushQuery";
import { ReviewQuery } from "../../../application/sync/shared/dto/ReviewQuery";
import { App } from "obsidian";
import { logger } from "../../../shared/logger/loggerInstance";
import { PtuneSyncStatusEnvelope } from "../ptune-sync-uri/PtuneSyncStatusEnvelope";
import { PtuneSyncUriClient } from "../ptune-sync-uri/PtuneSyncUriClient";
import { PtuneSyncUriLauncher } from "../ptune-sync-uri/PtuneSyncUriLauncher";
import { PtuneSyncClient } from "../shared/PtuneSyncClient";
import { PtuneTaskRequestFileWriter } from "./PtuneTaskRequestFileWriter";
import { PtuneTaskStatusWatcher } from "./PtuneTaskStatusWatcher";
import { PtuneTaskUriBuilder } from "./PtuneTaskUriBuilder";
import { PtuneTaskWorkDir } from "./PtuneTaskWorkDir";

export class PtuneTaskUriClient implements PtuneSyncClient {
  private readonly workDir: PtuneTaskWorkDir;
  private readonly writer: PtuneTaskRequestFileWriter;
  private readonly builder: PtuneTaskUriBuilder;
  private readonly launcher: PtuneSyncUriLauncher;
  private readonly watcher: PtuneTaskStatusWatcher;

  constructor(
    app: App,
    private readonly client: PtuneSyncUriClient,
  ) {
    this.workDir = new PtuneTaskWorkDir(app);
    this.writer = new PtuneTaskRequestFileWriter(app, this.workDir);
    this.builder = new PtuneTaskUriBuilder();
    this.launcher = new PtuneSyncUriLauncher();
    this.watcher = new PtuneTaskStatusWatcher(app, this.workDir);
  }

  async authStatus<TData>(): Promise<PtuneSyncStatusEnvelope<TData>> {
    const prepared = await this.writer.write("auth-status");
    const uri = this.builder.buildAuthStatus(prepared.requestId, prepared.requestFile);

    logger.info(
      `[Sync] [PtuneTaskUriClient] authStatus start requestId=${prepared.requestId}`,
    );
    logger.debug(
      `[Sync] [PtuneTaskUriClient] authStatus requestFile=${prepared.requestFile} statusFile=${prepared.statusFile}`,
    );
    logger.debug(`[Sync] [PtuneTaskUriClient] authStatus uri=${uri}`);

    const baseline = new Date();
    await this.launcher.launch(uri);
    await this.watcher.waitForAccepted<TData>(prepared.requestId, baseline);
    return this.watcher.waitForCompletion<TData>(prepared.requestId, baseline);
  }

  async authLogin<TData>(): Promise<PtuneSyncStatusEnvelope<TData>> {
    const prepared = await this.writer.write("auth-login");
    const uri = this.builder.buildAuthLogin(prepared.requestId, prepared.requestFile);

    logger.info(
      `[Sync] [PtuneTaskUriClient] authLogin start requestId=${prepared.requestId}`,
    );
    logger.debug(
      `[Sync] [PtuneTaskUriClient] authLogin requestFile=${prepared.requestFile} statusFile=${prepared.statusFile}`,
    );
    logger.debug(`[Sync] [PtuneTaskUriClient] authLogin uri=${uri}`);

    const baseline = new Date();
    await this.launcher.launch(uri);
    await this.watcher.waitForAccepted<TData>(prepared.requestId, baseline);
    return this.watcher.waitForAuthLoginCompletion<TData>(prepared.requestId, baseline);
  }

  async pull<TData>(query: PullQuery): Promise<PtuneSyncStatusEnvelope<TData>> {
    const prepared = await this.writer.writePull(query);
    const uri = this.builder.buildPull(prepared.requestId, prepared.requestFile);

    logger.info(
      `[Sync] [PtuneTaskUriClient] pull start requestId=${prepared.requestId} list=${query.list}`,
    );
    logger.debug(
      `[Sync] [PtuneTaskUriClient] pull requestFile=${prepared.requestFile} statusFile=${prepared.statusFile}`,
    );
    logger.debug(`[Sync] [PtuneTaskUriClient] pull uri=${uri}`);

    const baseline = new Date();
    await this.launcher.launch(uri);
    await this.watcher.waitForAccepted<TData>(prepared.requestId, baseline);
    return this.watcher.waitForCompletion<TData>(prepared.requestId, baseline);
  }

  review<TData>(query: ReviewQuery): Promise<PtuneSyncStatusEnvelope<TData>> {
    logger.debug("[Sync] [PtuneTaskUriClient] review delegated to legacy URI client");
    return this.client.review<TData>(query);
  }

  async diff<TData>(
    payload: string,
    query: PushQuery,
  ): Promise<PtuneSyncStatusEnvelope<TData>> {
    const prepared = await this.writer.writeDiff(query, payload);
    const uri = this.builder.buildDiff(prepared.requestId, prepared.requestFile);

    logger.info(
      `[Sync] [PtuneTaskUriClient] diff start requestId=${prepared.requestId} list=${query.list}`,
    );
    logger.debug(
      `[Sync] [PtuneTaskUriClient] diff requestFile=${prepared.requestFile} statusFile=${prepared.statusFile} inputFile=${prepared.inputFile}`,
    );
    logger.debug(`[Sync] [PtuneTaskUriClient] diff uri=${uri}`);

    const baseline = new Date();
    await this.launcher.launch(uri);
    await this.watcher.waitForAccepted<TData>(prepared.requestId, baseline);
    return this.watcher.waitForCompletion<TData>(prepared.requestId, baseline);
  }

  async push<TData>(
    payload: string,
    query: PushQuery,
  ): Promise<PtuneSyncStatusEnvelope<TData>> {
    const prepared = await this.writer.writePush(query, payload);
    const uri = this.builder.buildPush(prepared.requestId, prepared.requestFile);

    logger.info(
      `[Sync] [PtuneTaskUriClient] push start requestId=${prepared.requestId} list=${query.list} allowDelete=${query.allowDelete === true}`,
    );
    logger.debug(
      `[Sync] [PtuneTaskUriClient] push requestFile=${prepared.requestFile} statusFile=${prepared.statusFile} inputFile=${prepared.inputFile}`,
    );
    logger.debug(`[Sync] [PtuneTaskUriClient] push uri=${uri}`);

    const baseline = new Date();
    await this.launcher.launch(uri);
    await this.watcher.waitForAccepted<TData>(prepared.requestId, baseline);
    return this.watcher.waitForCompletion<TData>(prepared.requestId, baseline);
  }
}
