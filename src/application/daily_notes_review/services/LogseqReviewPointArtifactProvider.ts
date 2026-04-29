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
    await this.templateService.ensureForDailyNote(note, doc);
    
    // 現在は Deep link を既定で使用。将来的に設定で切り替え可能にする。
    const link = this.templateService.buildDeepLink(note.date);
    
    return {
      logseqJournalLink: link,
    };
  }

  async writeInputFile(note: DailyNote, content: string): Promise<ReviewPointArtifactLinks> {
    await this.templateService.writeJournalContent(note, content);
    return {};
  }
}
