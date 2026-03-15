import { App } from "obsidian";
import { GenerateDailyNotesReviewUseCase } from "../../application/daily_notes_review/usecases/GenerateDailyNotesReviewUseCase";
import { DailyNotesReportBuilder } from "../../application/daily_notes_review/builders/DailyNotesReportBuilder";
import { CollectCreatedNotesUseCase } from "../../application/note_scan/usecases/CollectCreatedNotesUseCase";
import { NoteSummaryGenerator } from "../../application/note_review/services/NoteSummaryGenerator";
import { PreviewNoteSummaryUseCase } from "../../application/note_review/usecases/PreviewNoteSummaryUseCase";
import { SaveNoteSummaryUseCase } from "../../application/note_review/usecases/SaveNoteSummaryUseCase";
import { DailyNotesReviewWriter } from "../../infrastructure/document/review/DailyNotesReviewWriter";
import { LlmClient } from "../../infrastructure/llm/LlmClient";
import { CreatedProjectNoteRepository } from "../../infrastructure/repository/CreatedProjectNoteRepository";
import { ProjectNoteFrontmatterRepository } from "../../infrastructure/repository/ProjectNoteFrontmatterRepository";
import { DailyNotesReviewFeature } from "../../presentation/daily_notes_review/DailyNotesReviewFeature";
import { NoteReviewFeature } from "../../presentation/note_review/NoteReviewFeature";
import { PtuneRuntime } from "../../shared/PtuneRuntime";
import { CalendarFactory } from "./CalendarFactory";

export class ReviewFeatureFactory {
  constructor(
    private readonly app: App,
    private readonly runtime: PtuneRuntime,
    private readonly calendarFactory: CalendarFactory,
  ) {}

  createNoteReviewFeature(): NoteReviewFeature {
    const llm = new LlmClient();
    const repo = new ProjectNoteFrontmatterRepository(this.app);
    const generator = new NoteSummaryGenerator(llm, repo);

    return new NoteReviewFeature(
      this.app,
      llm,
      new PreviewNoteSummaryUseCase(generator),
      new SaveNoteSummaryUseCase(repo),
    );
  }

  createDailyNotesReviewFeature(): DailyNotesReviewFeature {
    const llm = new LlmClient();
    const noteRepo = new ProjectNoteFrontmatterRepository(this.app);
    const createdRepo = new CreatedProjectNoteRepository(this.app);

    return new DailyNotesReviewFeature(
      this.app,
      llm,
      this.calendarFactory.createTodayResolver(),
      new GenerateDailyNotesReviewUseCase(
        this.calendarFactory.createCreateDailyNoteUseCase(),
        this.runtime.dailyNoteRepository,
        new CollectCreatedNotesUseCase(createdRepo, noteRepo),
        createdRepo,
        noteRepo,
        new NoteSummaryGenerator(llm, noteRepo),
        llm,
        new DailyNotesReviewWriter(),
        new DailyNotesReportBuilder(),
      ),
    );
  }
}
