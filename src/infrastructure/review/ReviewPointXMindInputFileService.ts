import { App, normalizePath } from "obsidian";
import { DailyNote } from "../../domain/daily/DailyNote";
import { logger } from "../../shared/logger/loggerInstance";

export type ReviewPointXMindInputFile = {
  vaultPath: string;
  markdownLinkPath: string;
};

export class ReviewPointXMindInputFileService {
  constructor(private readonly app: App) {}

  async writeForDailyNote(note: DailyNote, content: string): Promise<ReviewPointXMindInputFile> {
    const targetPath = normalizePath(
      `${this.resolveParentDir(note.filePath)}/${note.date}_reviewpoint_input.txt`,
    );
    logger.debug(
      `[Service] ReviewPointXMindInputFileService.write target=${targetPath} bytes=${content.length}`,
    );
    await this.app.vault.adapter.write(targetPath, content);

    return {
      vaultPath: targetPath,
      markdownLinkPath: encodeLinkDestination(targetPath),
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
