import { ReviewPointArtifactProvider, ReviewPointArtifactLinks } from "./ReviewPointArtifactProvider";
import { DailyNote } from "../../../domain/daily/DailyNote";
import { DailyNotesReflectionDocument } from "../models/DailyNotesReflectionDocument";
import { ReviewPointXMindTemplateService } from "../../../infrastructure/review/ReviewPointXMindTemplateService";

export class XMindReviewPointArtifactProvider implements ReviewPointArtifactProvider {
  constructor(
    private readonly templateService: ReviewPointXMindTemplateService,
  ) { }

  async prepareArtifactLinks(
    note: DailyNote,
    doc?: DailyNotesReflectionDocument,
  ): Promise<ReviewPointArtifactLinks> {
    const xmindFile = await this.templateService.ensureForDailyNote(note, doc);
    return {
      xmindFileLink: xmindFile.markdownLinkPath,
    };
  }
}
