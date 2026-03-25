import { App, normalizePath } from "obsidian";
import { DailyNote } from "../../domain/daily/DailyNote";
import { logger } from "../../shared/logger/loggerInstance";
import { config } from "../../config/config";

export type ReviewPointXMindTemplate = {
  vaultPath: string;
  markdownLinkPath: string;
  created: boolean;
};

export class ReviewPointXMindTemplateService {
  constructor(private readonly app: App) {}

  async ensureForDailyNote(note: DailyNote): Promise<ReviewPointXMindTemplate> {
    const targetPath = normalizePath(
      `${this.resolveParentDir(note.filePath)}/${note.date}_reviewpoint.xmind`,
    );
    const exists = await this.app.vault.adapter.exists(targetPath);

    if (!exists) {
      const sourcePath = normalizePath(config.settings.review.xmindTemplatePath);
      logger.debug(
        `[Service] ReviewPointXMindTemplateService.copy start source=${sourcePath} target=${targetPath}`,
      );
      if (!(await this.app.vault.adapter.exists(sourcePath))) {
        throw new Error(`XMind template not found: ${sourcePath}`);
      }
      const data = await this.app.vault.adapter.readBinary(sourcePath);
      await this.app.vault.adapter.writeBinary(targetPath, data);
      logger.debug(
        `[Service] ReviewPointXMindTemplateService.copy end target=${targetPath}`,
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
}

function encodeLinkDestination(value: string): string {
  return value
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}
