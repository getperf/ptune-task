// src/infrastructure/repository/DailyNoteRepository.ts

import { App, TFile } from "obsidian";
import { PtuneRuntime } from "../../shared/PtuneRuntime";
import { DailyNote } from "../../domain/daily/DailyNote";
import { logger } from "../../shared/logger/loggerInstance";

export class DailyNoteRepository {
  constructor(
    private readonly runtime: PtuneRuntime,
    private readonly app: App,
  ) { }

  async getActive(): Promise<DailyNote> {
    logger.debug("DailyNoteRepository.getActive started");

    const file = this.app.workspace.getActiveFile();
    if (!file) {
      logger.warn("getActive: No active file");
      throw new Error("No active file.");
    }

    const match = file.name.match(/^(\d{4}-\d{2}-\d{2})\.md$/);
    if (!match) {
      logger.warn(`getActive: Not a DailyNote file (${file.path})`);
      throw new Error("Active file is not a DailyNote.");
    }

    const content = await this.app.vault.read(file);
    logger.debug(`getActive: resolved date=${match[1]!}`);

    return new DailyNote(match[1]!, file.path, content);
  }

  async listExistingDates(): Promise<string[]> {
    const dir = this.runtime.resolveJournalDir();

    logger.debug(`listExistingDates: dir=${dir}`);

    try {
      const result = await this.app.vault.adapter.list(dir || "/");

      const dates = result.files
        .map((f) => f.split("/").pop() ?? f)
        .filter((name) => /^\d{4}-\d{2}-\d{2}\.md$/.test(name))
        .map((name) => name.replace(".md", ""));

      logger.debug(`listExistingDates: found ${dates.length} notes`);

      return dates;
    } catch {
      logger.warn(`listExistingDates: directory not found or unreadable (${dir})`);
      return [];
    }
  }

  async findByDate(date: string): Promise<DailyNote | null> {
    const notePath = this.runtime.resolveNoteUri(date);

    logger.debug(`findByDate: ${notePath}`);

    try {
      const content = await this.app.vault.adapter.read(notePath);
      logger.debug(`findByDate: loaded (${date})`);
      return new DailyNote(date, notePath, content);
    } catch {
      logger.debug(`findByDate: not found (${date})`);
      return null;
    }
  }

  async save(note: DailyNote): Promise<void> {
    logger.debug(`save: ${note.filePath}`);

    try {
      const existing = this.app.vault.getAbstractFileByPath(note.filePath);

      if (existing instanceof TFile) {
        await this.app.vault.modify(existing, note.content);
      } else {
        const dir = this.runtime.resolveJournalDir();
        if (dir && !(await this.app.vault.adapter.exists(dir))) {
          await this.app.vault.adapter.mkdir(dir);
        }
        await this.app.vault.create(note.filePath, note.content);
      }

      logger.info(`save: completed (${note.filePath})`);
    } catch (error) {
      logger.error(`save failed (${note.filePath})`, error);
      throw error;
    }
  }
}
