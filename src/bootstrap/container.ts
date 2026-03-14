import { App } from "obsidian";
import { GenerateDailyReviewUseCase } from "../application/review/usecases/GenerateDailyReviewUseCase";
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
import { SyncFactory } from "./factories/SyncFactory";
import { DailyNoteOpenHook } from "../infrastructure/obsidian/DailyNoteOpenHook";
import { LayoutReadyHook } from "../infrastructure/obsidian/LayoutReadyHook";
import { PtuneSyncUriAuthService } from "../infrastructure/sync/ptune-sync-uri/PtuneSyncUriAuthService";

export class Container {
  private readonly runtime: PtuneRuntime;
  private readonly calendarFactory: CalendarFactory;
  private readonly noteFactory: NoteFactory;
  private readonly presentationFactory: PresentationFactory;
  private readonly syncFactory: SyncFactory;
  private readonly hookFactory: HookFactory;

  constructor(private readonly app: App) {
    this.runtime = new PtuneRuntime(new ObsidianContext(app));
    this.calendarFactory = new CalendarFactory(app, this.runtime);
    this.noteFactory = new NoteFactory(app, this.runtime, this.calendarFactory);
    this.presentationFactory = new PresentationFactory(app);
    this.syncFactory = new SyncFactory(
      app,
      this.runtime,
      this.calendarFactory,
      this.presentationFactory.createConfirmDialog(),
    );
    this.hookFactory = new HookFactory(app, this.calendarFactory);
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
      this.createGenerateDailyReviewUseCase(),
      this.presentationFactory.createObsidianPresenter(),
    );
  }

  createDailyNoteOpenHook(): DailyNoteOpenHook {
    return this.hookFactory.createDailyNoteOpenHook();
  }

  createLayoutReadyHook(): LayoutReadyHook {
    return this.hookFactory.createLayoutReadyHook();
  }

  createNoteCreationFeature(): NoteCreationFeature {
    return this.noteFactory.createNoteCreationFeature();
  }

  createGenerateDailyReviewUseCase(): GenerateDailyReviewUseCase {
    return new GenerateDailyReviewUseCase(
      this.syncFactory.createSyncPort(),
      this.runtime.dailyNoteRepository,
    );
  }

  createAuthService(): PtuneSyncUriAuthService {
    return this.syncFactory.createAuthService();
  }
}
