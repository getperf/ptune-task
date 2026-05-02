import { App, normalizePath } from "obsidian";
import { DailyNote } from "../../domain/daily/DailyNote";
import { logger } from "../../shared/logger/loggerInstance";
import { config } from "../../config/config";
import { DailyNotesReflectionDocument } from "../../application/daily_notes_review/models/DailyNotesReflectionDocument";
import { XMindOutlineNode } from "./XMindOutline";
import { ReviewPointXMindOutlineTemplateService } from "./ReviewPointXMindOutlineTemplateService";
import { SimpleZipArchive } from "./SimpleZipArchive";
import { renderXMindContentXml } from "./XMindContentXml";

export type ReviewPointXMindTemplate = {
  vaultPath: string;
  markdownLinkPath: string;
  created: boolean;
};

export class ReviewPointXMindTemplateService {
  private readonly outlineTemplateService: ReviewPointXMindOutlineTemplateService;

  constructor(
    private readonly app: App,
    outlineTemplateService?: ReviewPointXMindOutlineTemplateService,
  ) {
    this.outlineTemplateService =
      outlineTemplateService ?? new ReviewPointXMindOutlineTemplateService(app);
  }

  async ensureForDailyNote(
    note: DailyNote,
    doc?: DailyNotesReflectionDocument,
  ): Promise<ReviewPointXMindTemplate> {
    const targetPath = normalizePath(
      `${this.resolveParentDir(note.filePath)}/${note.date}_reviewpoint.xmind`,
    );
    const exists = await this.app.vault.adapter.exists(targetPath);

    if (doc || !exists) {
      const sourcePath = normalizePath(config.settings.review.xmindTemplatePath);
      logger.debug(
        `[Service] ReviewPointXMindTemplateService.generate start source=${sourcePath} target=${targetPath} hasDoc=${doc ? "true" : "false"}`,
      );
      if (!(await this.app.vault.adapter.exists(sourcePath))) {
        throw new Error(`XMind template not found: ${sourcePath}`);
      }
      const sourceData = await this.app.vault.adapter.readBinary(sourcePath);
      const data = doc
        ? await this.generateReviewPointXMind(sourceData, note, doc)
        : sourceData;
      await this.app.vault.adapter.writeBinary(targetPath, data);
      logger.debug(
        `[Service] ReviewPointXMindTemplateService.generate end target=${targetPath}`,
      );
    }

    return {
      vaultPath: targetPath,
      markdownLinkPath: encodeLinkDestination(targetPath),
      created: !exists,
    };
  }

  private resolveParentDir(path: string): string {
    const index = path.lastIndexOf("/");
    return index >= 0 ? path.slice(0, index) : "";
  }

  private async generateReviewPointXMind(
    templateData: ArrayBuffer,
    note: DailyNote,
    doc: DailyNotesReflectionDocument,
  ): Promise<ArrayBuffer> {
    const archive = SimpleZipArchive.fromArrayBuffer(templateData);
    if (!archive.has("content.xml")) {
      throw new Error("XMind template does not contain content.xml");
    }

    const extraOutline = await this.outlineTemplateService.loadOutline();
    const outline = [
      this.buildFactNode(doc),
      ...extraOutline,
    ];
    const contentXml = renderXMindContentXml(
      archive.read("content.xml"),
      note.date,
      outline,
    );
    return archive.replace("content.xml", contentXml).toArrayBuffer();
  }

  private buildFactNode(doc: DailyNotesReflectionDocument): XMindOutlineNode {
    return {
      title: "Fact",
      children: doc.projects.map((project) => ({
        title: project.projectTitle,
        children: project.notes.map((note) => ({
          title: note.noteTitle,
          children: note.sentences.map((sentence) => ({
            title: sentence.text,
            children: [],
          })),
        })),
      })),
    };
  }
}

function encodeLinkDestination(value: string): string {
  return value
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}
