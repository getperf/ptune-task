import { DailyNote } from "../../../domain/daily/DailyNote";
import { DailyNotesReflectionDocument } from "../models/DailyNotesReflectionDocument";
import { ReviewPointArtifactProvider, ReviewPointArtifactLinks } from "./ReviewPointArtifactProvider";
import { ReviewPointLogseqJournalTemplateService } from "../../../infrastructure/review/ReviewPointLogseqJournalTemplateService";

export class LogseqReviewPointArtifactProvider implements ReviewPointArtifactProvider {
  constructor(
    private readonly templateService: ReviewPointLogseqJournalTemplateService,
  ) { }

  async prepareArtifactLinks(
    note: DailyNote,
    doc?: DailyNotesReflectionDocument,
  ): Promise<ReviewPointArtifactLinks> {
    const journal = await this.templateService.ensureForDailyNote(note, doc);
    return {
      logseqJournalLink: journal.markdownLinkPath,
    };
  }
}
