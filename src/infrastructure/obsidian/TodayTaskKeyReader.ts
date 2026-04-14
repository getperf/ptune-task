import { App, TFile } from "obsidian";
import { TodayResolver } from "../../application/calendar/services/TodayResolver";
import { TaskKeyOptionBuilder } from "../../application/note/TaskKeyOptionBuilder";
import { TaskKeyOption } from "../../application/note/TaskKeyOption";
import { PtuneRuntime } from "../../shared/PtuneRuntime";
import { logger } from "../../shared/logger/loggerInstance";

export class TodayTaskKeyReader {
  constructor(
    private readonly app: App,
    private readonly runtime: PtuneRuntime,
    private readonly todayResolver: TodayResolver,
    private readonly builder: TaskKeyOptionBuilder,
  ) {}

  readToday(): TaskKeyOption[] {
    const today = this.todayResolver.resolve();
    const path = this.runtime.resolveNoteUri(today);
    const file = this.app.vault.getAbstractFileByPath(path);

    logger.debug(`[Repository] TodayTaskKeyReader.readToday start date=${today} path=${path}`);

    if (!(file instanceof TFile)) {
      logger.debug(`[Repository] TodayTaskKeyReader.readToday noteMissing path=${path}`);
      return [];
    }

    const cache = this.app.metadataCache.getFileCache(file);
    const frontmatter =
      cache?.frontmatter && typeof cache.frontmatter === "object"
        ? cache.frontmatter as Record<string, unknown>
        : null;
    const raw = frontmatter?.taskKeys;
    const keys = this.extractTaskKeys(raw);

    logger.debug(`[Repository] TodayTaskKeyReader.readToday found count=${keys.length} path=${path}`);

    return this.builder.build(keys);
  }

  private extractTaskKeys(raw: unknown): string[] {
    if (Array.isArray(raw)) {
      return raw.filter((value): value is string => typeof value === "string");
    }

    if (raw && typeof raw === "object") {
      return Object.keys(raw);
    }

    return [];
  }
}
