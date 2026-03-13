import { PtuneSyncPort } from "../../application/sync/shared/ports/PtuneSyncPort";
import { PullAndMergeTodayUseCase } from "../../application/sync/pull/PullAndMergeTodayUseCase";
import { PushSyncUseCase } from "../../application/sync/push/PushSyncUseCase";
import { ApplyPushUseCase } from "../../application/sync/push/ApplyPushUseCase";
import { DiffDailyNoteUseCase } from "../../application/sync/diff/DiffDailyNoteUseCase";
import { MergeTaskTreeService } from "../../application/sync/merge/MergeTaskTreeService";
import { SyncAndRebuildDailyNoteUseCase } from "../../application/rebuild/SyncAndRebuildDailyNoteUseCase";
import { PtuneSyncCliAdapter } from "../../infrastructure/sync/ptune-sync/PtuneSyncCliAdapter";
import { PtuneSyncClient } from "../../infrastructure/sync/ptune-sync/PtuneSyncClient";
import { ProcessRunner } from "../../infrastructure/process/ProcessRunner";
import { ObsidianConfirmDialog } from "../../infrastructure/obsidian/ObsidianConfirmDialog";
import { CalendarFactory } from "./CalendarFactory";
import { PtuneRuntime } from "../../shared/PtuneRuntime";

export class SyncFactory {
  private readonly runner = new ProcessRunner();
  private readonly client = new PtuneSyncClient(this.runner);

  constructor(
    private readonly runtime: PtuneRuntime,
    private readonly calendarFactory: CalendarFactory,
    private readonly confirmDialog: ObsidianConfirmDialog,
  ) {}

  createClient(): PtuneSyncClient {
    return this.client;
  }

  createSyncPort(): PtuneSyncPort {
    return new PtuneSyncCliAdapter(this.client);
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

  createSyncDailyNoteUseCase(): PushSyncUseCase {
    const diffUseCase = new DiffDailyNoteUseCase(
      this.runtime.dailyNoteRepository,
      this.createSyncPort(),
    );
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
}
