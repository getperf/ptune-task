// src/bootstrap/container.ts

import * as vscode from "vscode";

import { ProcessRunner } from "../infrastructure/process/ProcessRunner";
import { PtuneSyncClient } from "../infrastructure/sync/ptune-sync/PtuneSyncClient";
import { PtuneSyncCliAdapter } from "../infrastructure/sync/ptune-sync/PtuneSyncCliAdapter";
import { MockPtuneSyncClient } from "../infrastructure/sync/ptune-sync/mock/MockPtuneSyncClient";
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
import { PtuneRuntime } from "../shared/PtuneRuntime";
import { CalendarViewProvider } from "../infrastructure/vscode/calendar/CalendarViewProvider";
import { PullTodayCommand } from "../presentation/pull/PullTodayCommand";
import { VSCodeConfirmDialog } from "../infrastructure/vscode/confirm/VSCodeConfirmDialog";
import { VsCodePresenter } from "../infrastructure/vscode/commands/VsCodePresenter";
import { GenerateDailyReviewUseCase } from "../application/review/usecases/GenerateDailyReviewUseCase";
import { PushAndRebuildCommand } from "../presentation/push/PushAndRebuildCommand";
import { ReviewCommand } from "../presentation/review/ReviewCommand";
import { PullAndMergeTodayUseCase } from "../application/sync/pull/PullAndMergeTodayUseCase";
import { MergeTaskTreeService } from "../application/sync/merge/MergeTaskTreeService";

export class Container {
  private readonly runtime = new PtuneRuntime();
  private readonly runner = new ProcessRunner();
  private readonly client = new PtuneSyncClient(this.runner);

  private calendarViewProvider?: CalendarViewProvider;

  constructor(private readonly context: vscode.ExtensionContext) { }

  // ------------------------------------------------------------
  // SyncPort
  // ------------------------------------------------------------

  private createSyncPort(): PtuneSyncPort {
    const config = vscode.workspace.getConfiguration("ptune-task");
    const useMock = config.get<boolean>("useMockSync", false);

    if (useMock) {
      return new MockPtuneSyncClient(this.context);
    }

    return new PtuneSyncCliAdapter(this.client);
  }

  // ------------------------------------------------------------
  // Repository
  // ------------------------------------------------------------

  private createDailyNoteRepository(): DailyNoteRepository {
    return new DailyNoteRepository(this.runtime);
  }

  // ------------------------------------------------------------
  // TodayResolver
  // ------------------------------------------------------------

  private createTodayResolver(): TodayResolver {
    const config = vscode.workspace.getConfiguration("ptune-task");
    const timeZone = config.get<string>("timeZone");

    return new TodayResolver(
      timeZone && timeZone.trim() !== "" ? timeZone : undefined,
    );
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
    const calendarViewProvider = this.createCalendarViewProvider();
    const presenter = new VsCodePresenter(calendarViewProvider);

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

    const confirm = new VSCodeConfirmDialog();

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
    const calendarViewProvider = this.createCalendarViewProvider();

    const presenter = new VsCodePresenter(calendarViewProvider);

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

    const presenter = new VsCodePresenter(this.createCalendarViewProvider());

    return new ReviewCommand(usecase, presenter);
  }

  // ------------------------------------------------------------
  // auth
  // ------------------------------------------------------------

  createAuthService(): PtuneSyncAuthService {
    return new PtuneSyncAuthService(this.client);
  }

  // ------------------------------------------------------------
  // CalendarViewProvider
  // ------------------------------------------------------------

  createCalendarViewProvider(): CalendarViewProvider {
    if (this.calendarViewProvider) {
      return this.calendarViewProvider;
    }

    this.calendarViewProvider = new CalendarViewProvider(
      this.context,
      this.createCreateDailyNoteUseCase(),
      this.createDailyNoteRepository(),
    );

    return this.calendarViewProvider;
  }
}
