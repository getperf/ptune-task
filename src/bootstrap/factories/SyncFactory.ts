import { App } from "obsidian";
import { PtuneSyncPort } from "../../application/sync/shared/ports/PtuneSyncPort";
import { PullAndMergeTodayUseCase } from "../../application/sync/pull/PullAndMergeTodayUseCase";
import { PushSyncUseCase } from "../../application/sync/push/PushSyncUseCase";
import { ApplyPushUseCase } from "../../application/sync/push/ApplyPushUseCase";
import { DiffDailyNoteUseCase } from "../../application/sync/diff/DiffDailyNoteUseCase";
import { MergeTaskTreeService } from "../../application/sync/merge/MergeTaskTreeService";
import { SyncAndRebuildDailyNoteUseCase } from "../../application/rebuild/SyncAndRebuildDailyNoteUseCase";
import { ObsidianConfirmDialog } from "../../infrastructure/obsidian/ObsidianConfirmDialog";
import { PtuneTaskUriClient } from "../../infrastructure/sync/ptune-task-uri/PtuneTaskUriClient";
import { PtuneSyncClient } from "../../infrastructure/sync/shared/PtuneSyncClient";
import { PtuneSyncWorkDir } from "../../infrastructure/sync/ptune-sync-uri/PtuneSyncWorkDir";
import { PtuneSyncUriBuilder } from "../../infrastructure/sync/ptune-sync-uri/PtuneSyncUriBuilder";
import { PtuneSyncUriLauncher } from "../../infrastructure/sync/ptune-sync-uri/PtuneSyncUriLauncher";
import { PtuneSyncStatusWatcher } from "../../infrastructure/sync/ptune-sync-uri/PtuneSyncStatusWatcher";
import { PtuneSyncInputFileWriter } from "../../infrastructure/sync/ptune-sync-uri/PtuneSyncInputFileWriter";
import { PtuneSyncUriClient } from "../../infrastructure/sync/ptune-sync-uri/PtuneSyncUriClient";
import { PtuneSyncUriAdapter } from "../../infrastructure/sync/ptune-sync-uri/PtuneSyncUriAdapter";
import { PtuneSyncUriAuthService } from "../../infrastructure/sync/ptune-sync-uri/PtuneSyncUriAuthService";
import { CalendarFactory } from "./CalendarFactory";
import { PtuneRuntime } from "../../shared/PtuneRuntime";
import { logger } from "../../shared/logger/loggerInstance";

export class SyncFactory {
  private readonly client: PtuneSyncClient;

  constructor(
    private readonly app: App,
    private readonly runtime: PtuneRuntime,
    private readonly calendarFactory: CalendarFactory,
    private readonly confirmDialog: ObsidianConfirmDialog,
  ) {
    this.client = this.createBackendClient();
  }

  createClient(): PtuneSyncClient {
    return this.client;
  }

  createSyncPort(): PtuneSyncPort {
    return new PtuneSyncUriAdapter(this.client);
  }

  createAuthService(): PtuneSyncUriAuthService {
    return new PtuneSyncUriAuthService(this.client);
  }

  createPullAndMergeTodayUseCase(): PullAndMergeTodayUseCase {
    return new PullAndMergeTodayUseCase(
      this.createSyncPort(),
      this.calendarFactory.createTodayResolver(),
      this.runtime.dailyNoteRepository,
      this.calendarFactory.createCreateDailyNoteUseCase(),
      this.runtime,
      new MergeTaskTreeService(),
    );
  }

  createDiffDailyNoteUseCase(): DiffDailyNoteUseCase {
    return new DiffDailyNoteUseCase(
      this.runtime.dailyNoteRepository,
      this.createSyncPort(),
    );
  }

  createSyncDailyNoteUseCase(): PushSyncUseCase {
    const diffUseCase = this.createDiffDailyNoteUseCase();
    const pushUseCase = new ApplyPushUseCase(this.createSyncPort());

    return new PushSyncUseCase(
      diffUseCase,
      pushUseCase,
      this.confirmDialog,
    );
  }

  createRebuildDailyNoteUseCase(): SyncAndRebuildDailyNoteUseCase {
    return new SyncAndRebuildDailyNoteUseCase(
      this.createSyncPort(),
      this.calendarFactory.createTodayResolver(),
      this.runtime.dailyNoteRepository,
      this.runtime,
    );
  }

  private createBackendClient(): PtuneSyncClient {
    logger.info("[Sync] [Factory] create backend=ptune-task");
    return new PtuneTaskUriClient(this.app, this.createLegacyUriClient());
  }

  private createLegacyUriClient(): PtuneSyncUriClient {
    const workDir = new PtuneSyncWorkDir(this.app);

    return new PtuneSyncUriClient(
      workDir,
      new PtuneSyncUriBuilder(workDir),
      new PtuneSyncUriLauncher(),
      new PtuneSyncStatusWatcher(this.app, workDir),
      new PtuneSyncInputFileWriter(this.app, workDir),
    );
  }
}
