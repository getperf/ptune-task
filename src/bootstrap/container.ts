// src/bootstrap/container.ts

import { App } from "obsidian";
import { ProcessRunner } from "../infrastructure/process/ProcessRunner";
import { PtuneSyncClient } from "../infrastructure/sync/ptune-sync/PtuneSyncClient";
import { PtuneSyncCliAdapter } from "../infrastructure/sync/ptune-sync/PtuneSyncCliAdapter";
import { PtuneSyncAuthService } from "../infrastructure/sync/ptune-sync/PtuneSyncAuthService";

import { DailyNoteRepository } from "../infrastructure/repository/DailyNoteRepository";
import { DailyNoteFactory } from "../infrastructure/document/daily/DailyNoteFactory";
import { DailyTemplateBuilder } from "../infrastructure/document/daily/DailyTemplateBuilder";

import { TodayResolver } from "../application/calendar/services/TodayResolver";
import { CreateDailyNoteUseCase } from "../application/calendar/usecases/CreateDailyNoteUseCase";

import { ApplyPushUseCase } from "../application/sync/push/ApplyPushUseCase";
import { PushSyncUseCase } from "../application/sync/push/PushSyncUseCase";
import { DiffDailyNoteUseCase } from "../application/sync/diff/DiffDailyNoteUseCase";
import { SyncAndRebuildDailyNoteUseCase } from "../application/rebuild/SyncAndRebuildDailyNoteUseCase";

import { PtuneSyncPort } from "../application/sync/shared/ports/PtuneSyncPort";
import { PtuneRuntime } from "shared/PtuneRuntime";
import { ObsidianContext } from "../infrastructure/obsidian/ObsidianContext";
import { PullTodayCommand } from "../presentation/pull/PullTodayCommand";
import { ObsidianConfirmDialog } from "../infrastructure/obsidian/ObsidianConfirmDialog";
import { ObsidianPresenter } from "../infrastructure/obsidian/ObsidianPresenter";
import { GenerateDailyReviewUseCase } from "../application/review/usecases/GenerateDailyReviewUseCase";
import { PushAndRebuildCommand } from "../presentation/push/PushAndRebuildCommand";
import { ReviewCommand } from "../presentation/review/ReviewCommand";
import { PullAndMergeTodayUseCase } from "../application/sync/pull/PullAndMergeTodayUseCase";
import { MergeTaskTreeService } from "../application/sync/merge/MergeTaskTreeService";

export class Container {
  private readonly obsidianContext: ObsidianContext;
  private readonly runtime: PtuneRuntime;
  private readonly runner = new ProcessRunner();
  private readonly client = new PtuneSyncClient(this.runner);

  constructor(private readonly app: App) {
    this.obsidianContext = new ObsidianContext(app);
    this.runtime = new PtuneRuntime(this.obsidianContext);
  }

  // ------------------------------------------------------------
  // SyncPort
  // ------------------------------------------------------------

  private createSyncPort(): PtuneSyncPort {
    return new PtuneSyncCliAdapter(this.client);
  }

  // ------------------------------------------------------------
  // Repository
  // ------------------------------------------------------------

  private createDailyNoteRepository(): DailyNoteRepository {
    return this.runtime.dailyNoteRepository;
  }

  // ------------------------------------------------------------
  // TodayResolver
  // ------------------------------------------------------------

  private createTodayResolver(): TodayResolver {
    return new TodayResolver(undefined);
  }

  // ------------------------------------------------------------
  // DailyNoteFactory
  // ------------------------------------------------------------

  private createDailyNoteFactory(): DailyNoteFactory {
    return new DailyNoteFactory(this.runtime, new DailyTemplateBuilder());
  }

  // ------------------------------------------------------------
  // CreateDailyNoteUseCase
  // ------------------------------------------------------------

  private createCreateDailyNoteUseCase(): CreateDailyNoteUseCase {
    return new CreateDailyNoteUseCase(
      this.createDailyNoteRepository(),
      this.createDailyNoteFactory(),
    );
  }

  // ------------------------------------------------------------
  // PullAndMergeTodayUseCase（Orchestrator）
  // ------------------------------------------------------------

  createPullAndMergeTodayUseCase(): PullAndMergeTodayUseCase {
    return new PullAndMergeTodayUseCase(
      this.createSyncPort(),
      this.createTodayResolver(),
      this.createDailyNoteRepository(),
      this.createCreateDailyNoteUseCase(),
      this.runtime,
      new MergeTaskTreeService(),
    );
  }

  createPullTodayCommand(): PullTodayCommand {
    const useCase = this.createPullAndMergeTodayUseCase();
    const presenter = new ObsidianPresenter(this.app);

    return new PullTodayCommand(useCase, presenter);
  }
  // ------------------------------------------------------------
  // Sync
  // ------------------------------------------------------------

  createSyncDailyNoteUseCase(): PushSyncUseCase {
    const repository = this.createDailyNoteRepository();
    const syncPort = this.createSyncPort();

    const diffUseCase = new DiffDailyNoteUseCase(repository, syncPort);

    const pushUseCase = new ApplyPushUseCase(syncPort);

    const confirm = new ObsidianConfirmDialog(this.app);

    return new PushSyncUseCase(diffUseCase, pushUseCase, confirm);
  }

  createRebuildDailyNoteUseCase(): SyncAndRebuildDailyNoteUseCase {
    return new SyncAndRebuildDailyNoteUseCase(
      this.createSyncPort(),
      this.createTodayResolver(),
      this.createDailyNoteRepository(),
      this.runtime
    );
  }

  createSyncAndRebuildCommand(): PushAndRebuildCommand {
    const presenter = new ObsidianPresenter(this.app);

    return new PushAndRebuildCommand(
      this.createTodayResolver(),
      this.createDailyNoteRepository(),
      this.createSyncDailyNoteUseCase(),
      this.createRebuildDailyNoteUseCase(),
      presenter,
    );
  }

  // ------------------------------------------------------------
  // review
  // ------------------------------------------------------------

  createGenerateDailyReviewUseCase(): GenerateDailyReviewUseCase {
    const syncPort = this.createSyncPort();
    const repository = this.createDailyNoteRepository();

    return new GenerateDailyReviewUseCase(syncPort, repository);
  }

  createReviewCommand(): ReviewCommand {
    const usecase = this.createGenerateDailyReviewUseCase();

    const presenter = new ObsidianPresenter(this.app);

    return new ReviewCommand(usecase, presenter);
  }

  // ------------------------------------------------------------
  // auth
  // ------------------------------------------------------------

  createAuthService(): PtuneSyncAuthService {
    return new PtuneSyncAuthService(this.client);
  }

}
