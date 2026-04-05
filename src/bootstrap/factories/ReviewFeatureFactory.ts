import { App } from "obsidian";
import { NoteSummaryGenerator } from "../../application/note_review/services/NoteSummaryGenerator";
import { LoadNoteSummaryUseCase } from "../../application/note_review/usecases/LoadNoteSummaryUseCase";
import { PreviewNoteSummaryUseCase } from "../../application/note_review/usecases/PreviewNoteSummaryUseCase";
import { SaveNoteSummaryUseCase } from "../../application/note_review/usecases/SaveNoteSummaryUseCase";
import { EventHookNoticeMapper } from "../../infrastructure/event_hook/EventHookNoticeMapper";
import { EventHookService } from "../../infrastructure/event_hook/EventHookService";
import { LlmClient } from "../../infrastructure/llm/LlmClient";
import { ProjectNoteFrontmatterRepository } from "../../infrastructure/repository/ProjectNoteFrontmatterRepository";
import { NoteReviewFeature } from "../../presentation/note_review/NoteReviewFeature";

export class ReviewFeatureFactory {
  constructor(private readonly app: App) {}

  createNoteReviewFeature(): NoteReviewFeature {
    const llm = new LlmClient();
    const repo = new ProjectNoteFrontmatterRepository(this.app);
    const generator = new NoteSummaryGenerator(llm, repo);

    return new NoteReviewFeature(
      this.app,
      llm,
      new LoadNoteSummaryUseCase(repo),
      new PreviewNoteSummaryUseCase(generator),
      new SaveNoteSummaryUseCase(repo),
      new EventHookService(this.app),
      new EventHookNoticeMapper(),
    );
  }
}
