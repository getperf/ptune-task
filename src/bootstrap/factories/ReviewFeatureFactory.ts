import { App } from "obsidian";

import { EventHookNoticeMapper } from "../../infrastructure/event_hook/EventHookNoticeMapper";
import { EventHookService } from "../../infrastructure/event_hook/EventHookService";

import { NoteReviewFeature } from "../../presentation/note_review/NoteReviewFeature";

export class ReviewFeatureFactory {
  constructor(private readonly app: App) {}

  createNoteReviewFeature(): NoteReviewFeature {

    return new NoteReviewFeature(
      this.app,

      new EventHookService(this.app),
		new EventHookNoticeMapper(),
    );
  }
}
