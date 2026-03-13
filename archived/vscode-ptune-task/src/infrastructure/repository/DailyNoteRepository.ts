// src/infrastructure/repository/DailyNoteRepository.ts

import * as vscode from "vscode";
import { PtuneRuntime } from "../../shared/PtuneRuntime";
import { DailyNote } from "../../domain/daily/DailyNote";
import { Logger } from "../../shared/logger/Logger";

export class DailyNoteRepository {
  constructor(private readonly runtime: PtuneRuntime) {}

  async getActive(): Promise<DailyNote> {
    const logger = Logger.get();
    logger.debug("DailyNoteRepository.getActive started");

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      logger.warn("getActive: No active editor");
      throw new Error("No active editor.");
    }

    const document = editor.document;
    const filePath = document.uri.fsPath;
    const content = document.getText();

    const match = filePath.match(/(\d{4}-\d{2}-\d{2})\.md$/);
    if (!match) {
      logger.warn(`getActive: Not a DailyNote file (${filePath})`);
      throw new Error("Active file is not a DailyNote.");
    }

    logger.debug(`getActive: resolved date=${match[1]}`);

    return new DailyNote(match[1], filePath, content);
  }

  async listExistingDates(): Promise<string[]> {
    const logger = Logger.get();
    const dir = this.runtime.resolveJournalDir();

    logger.debug(`listExistingDates: dir=${dir.fsPath}`);

    try {
      const entries = await vscode.workspace.fs.readDirectory(dir);

      const dates = entries
        .filter(
          ([name, type]) =>
            type === vscode.FileType.File &&
            /^\d{4}-\d{2}-\d{2}\.md$/.test(name),
        )
        .map(([name]) => name.replace(".md", ""));

      logger.debug(`listExistingDates: found ${dates.length} notes`);

      return dates;
    } catch (error) {
      logger.warn(
        `listExistingDates: directory not found or unreadable (${dir.fsPath})`,
      );
      return [];
    }
  }

  async findByDate(date: string): Promise<DailyNote | null> {
    const logger = Logger.get();
    const uri = this.runtime.resolveNoteUri(date);

    logger.debug(`findByDate: ${uri.fsPath}`);

    try {
      const bytes = await vscode.workspace.fs.readFile(uri);
      const content = Buffer.from(bytes).toString("utf8");

      logger.debug(`findByDate: loaded (${date})`);

      return new DailyNote(date, uri.fsPath, content);
    } catch {
      logger.debug(`findByDate: not found (${date})`);
      return null;
    }
  }

  async save(note: DailyNote): Promise<void> {
    const logger = Logger.get();

    logger.debug(`save: ${note.filePath}`);

    try {
      await vscode.workspace.fs.createDirectory(
        this.runtime.resolveJournalDir(),
      );

      const uri = vscode.Uri.file(note.filePath);

      await vscode.workspace.fs.writeFile(
        uri,
        Buffer.from(note.content, "utf8"),
      );

      logger.info(`save: completed (${note.filePath})`);
    } catch (error) {
      logger.error(`save failed (${note.filePath})`, error);
      throw error;
    }
  }
}
