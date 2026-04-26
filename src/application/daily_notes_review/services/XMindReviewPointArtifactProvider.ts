import { ReviewPointArtifactProvider, ReviewPointArtifactLinks } from "./ReviewPointArtifactProvider";
import { DailyNote } from "../../../domain/daily/DailyNote";
import { ReviewPointXMindTemplateService } from "../../../infrastructure/review/ReviewPointXMindTemplateService";
import { ReviewPointXMindInputFileService } from "../../../infrastructure/review/ReviewPointXMindInputFileService";

export class XMindReviewPointArtifactProvider implements ReviewPointArtifactProvider {
  constructor(
    private readonly templateService: ReviewPointXMindTemplateService,
    private readonly inputFileService: ReviewPointXMindInputFileService,
  ) { }

  async prepareArtifactLinks(note: DailyNote): Promise<ReviewPointArtifactLinks> {
    const xmindFile = await this.templateService.ensureForDailyNote(note);
    return {
      xmindFileLink: xmindFile.markdownLinkPath,
    };
  }

  async writeInputFile(note: DailyNote, content: string): Promise<ReviewPointArtifactLinks> {
    const inputFile = await this.inputFileService.writeForDailyNote(note, content);
    return {
      xmindInputFileLink: inputFile.markdownLinkPath,
    };
  }
}
