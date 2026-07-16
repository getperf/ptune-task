import { App } from "obsidian";
import { GenerateDailyReviewFlowUseCase } from "../application/review_flow/usecases/GenerateDailyReviewFlowUseCase";
import { GenerateDailyReviewUseCase } from "../application/review/usecases/GenerateDailyReviewUseCase";

import { ReviewFlowOptionsResolver } from "../application/review_flow/services/ReviewFlowOptionsResolver";
import { ObsidianContext } from "../infrastructure/obsidian/ObsidianContext";
import { PullTodayCommand } from "../presentation/pull/PullTodayCommand";
import { PushAndRebuildCommand } from "../presentation/push/PushAndRebuildCommand";
import { ReviewCommand } from "../presentation/review/ReviewCommand";
import { NoteCreationFeature } from "../presentation/note/NoteCreationFeature";
import { PtuneRuntime } from "../shared/PtuneRuntime";
import { CalendarFactory } from "./factories/CalendarFactory";
import { HookFactory } from "./factories/HookFactory";
import { NoteFactory } from "./factories/NoteFactory";
import { PresentationFactory } from "./factories/PresentationFactory";
import { ReviewFeatureFactory } from "./factories/ReviewFeatureFactory";
import { SyncFactory } from "./factories/SyncFactory";
import { DailyNoteOpenHook } from "../infrastructure/obsidian/DailyNoteOpenHook";
import { LayoutReadyHook } from "../infrastructure/obsidian/LayoutReadyHook";
import { ProjectIndexOpenHook } from "../infrastructure/obsidian/ProjectIndexOpenHook";
import { PtuneSyncUriAuthService } from "../infrastructure/sync/ptune-sync-uri/PtuneSyncUriAuthService";
import { SetupChecklistService } from "../application/setup/services/SetupChecklistService";
import { NoteSetupHelper } from "../infrastructure/setup/NoteSetupHelper";
import { SetupWizardDialog } from "../presentation/setup/SetupWizardDialog";
import { AuthLoginProgressService } from "../presentation/auth/AuthLoginProgressService";
import { EventHookService } from "../infrastructure/event_hook/EventHookService";
import { DailyReviewEventHookService } from "../infrastructure/event_hook/DailyReviewEventHookService";
import { DailyReviewCompletionEventHookService } from "../infrastructure/event_hook/DailyReviewCompletionEventHookService";

export class Container {
  private readonly runtime: PtuneRuntime;
  private readonly calendarFactory: CalendarFactory;
  private readonly noteFactory: NoteFactory;
  private readonly reviewFeatureFactory: ReviewFeatureFactory;
  private readonly presentationFactory: PresentationFactory;
  private readonly syncFactory: SyncFactory;
  private readonly hookFactory: HookFactory;

  constructor(private readonly app: App) {
    this.runtime = new PtuneRuntime(new ObsidianContext(app));
    this.calendarFactory = new CalendarFactory(app, this.runtime);
    this.noteFactory = new NoteFactory(app, this.runtime, this.calendarFactory);
    this.reviewFeatureFactory = new ReviewFeatureFactory(app);
    this.presentationFactory = new PresentationFactory(app);
    this.syncFactory = new SyncFactory(
      app,
      this.runtime,
      this.calendarFactory,
      this.presentationFactory.createConfirmDialog(),
    );
    this.hookFactory = new HookFactory(app, this.runtime, this.calendarFactory);
  }

  createPullTodayCommand(): PullTodayCommand {
    return new PullTodayCommand(
      this.syncFactory.createPullAndMergeTodayUseCase(),
      this.presentationFactory.createObsidianPresenter(),
    );
  }

  createSyncAndRebuildCommand(): PushAndRebuildCommand {
    return new PushAndRebuildCommand(
      this.calendarFactory.createTodayResolver(),
      this.runtime.dailyNoteRepository,
      this.syncFactory.createSyncDailyNoteUseCase(),
      this.syncFactory.createRebuildDailyNoteUseCase(),
      this.presentationFactory.createObsidianPresenter(),
    );
  }

  createReviewCommand(): ReviewCommand {
    return new ReviewCommand(
      this.calendarFactory.createTodayResolver(),
      new ReviewFlowOptionsResolver(),
      this.createGenerateDailyReviewFlowUseCase(),
      this.presentationFactory.createObsidianPresenter(),
    );
  }

  createDailyNoteOpenHook(): DailyNoteOpenHook {
    return this.hookFactory.createDailyNoteOpenHook();
  }

  createLayoutReadyHook(): LayoutReadyHook {
    return this.hookFactory.createLayoutReadyHook();
  }

  createProjectIndexOpenHook(): ProjectIndexOpenHook {
    return this.hookFactory.createProjectIndexOpenHook();
  }

  createNoteCreationFeature(): NoteCreationFeature {
    return this.noteFactory.createNoteCreationFeature();
  }

  createNoteReviewFeature() {
    return this.reviewFeatureFactory.createNoteReviewFeature();
  }

  createEventHookService(): EventHookService {
    return new EventHookService(this.app);
  }

  createGenerateDailyReviewUseCase(): GenerateDailyReviewUseCase {
    return new GenerateDailyReviewUseCase(
      this.syncFactory.createSyncPort(),
      this.runtime.dailyNoteRepository,
      this.calendarFactory.createCreateDailyNoteUseCase(),
    );
  }

  createGenerateDailyReviewFlowUseCase(): GenerateDailyReviewFlowUseCase {
    return new GenerateDailyReviewFlowUseCase(
      this.syncFactory.createPullAndMergeTodayUseCase(),
      this.createGenerateDailyReviewUseCase(),
      this.calendarFactory.createCreateDailyNoteUseCase(),
      new DailyReviewEventHookService(
        new EventHookService(this.app),
      ),
      new DailyReviewCompletionEventHookService(),
    );
  }

  createAuthService(): PtuneSyncUriAuthService {
    return this.syncFactory.createAuthService();
  }

  createAuthLoginProgressService(): AuthLoginProgressService {
    return new AuthLoginProgressService(this.app);
  }

  createSetupChecklistService(): SetupChecklistService {
    return new SetupChecklistService(this.app, this.createAuthService());
  }

  createSetupWizardDialog(): SetupWizardDialog {
    return new SetupWizardDialog(
      this.app,
      this.createSetupChecklistService(),
      new NoteSetupHelper(this.app),
    );
  }
}
