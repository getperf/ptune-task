import { App, TFile, normalizePath } from "obsidian";
import { DailyNote } from "../../domain/daily/DailyNote";
import { DailyNotesReflectionDocument } from "../../application/daily_notes_review/models/DailyNotesReflectionDocument";
import { logger } from "../../shared/logger/loggerInstance";
import { config } from "../../config/config";

export type ReviewPointLogseqJournal = {
  vaultPath: string;
  markdownLinkPath: string;
  created: boolean;
};

export class ReviewPointLogseqJournalTemplateService {
  constructor(private readonly app: App) { }

  async ensureForDailyNote(
    note: DailyNote,
    doc?: DailyNotesReflectionDocument,
  ): Promise<ReviewPointLogseqJournal> {
    const rootPath = normalizePath(config.settings.review.logseqRootPath || "_review_logseq");
    const journalFolder = normalizePath(`${rootPath}/journals`);
    const pagesFolder = normalizePath(`${rootPath}/pages`);
    const logseqFolder = normalizePath(`${rootPath}/logseq`);

    await this.ensureFolder(rootPath);
    await this.ensureFolder(journalFolder);
    await this.ensureFolder(pagesFolder);
    await this.ensureFolder(logseqFolder);

    const targetPath = normalizePath(
      `${journalFolder}/${this.buildJournalFileName(note.date)}`,
    );
    const exists = await this.app.vault.adapter.exists(targetPath);

    if (!exists) {
      const content = await this.buildJournalContent(note, doc);
      logger.debug(
        `[Service] ReviewPointLogseqJournalTemplateService.write target=${targetPath} bytes=${content.length}`,
      );
      await this.app.vault.adapter.write(targetPath, content);
    }

    return {
      vaultPath: targetPath,
      markdownLinkPath: encodeLinkDestination(targetPath),
      created: !exists,
    };
  }

  async writeJournalContent(note: DailyNote, summaryList: string): Promise<void> {
    const rootPath = normalizePath(config.settings.review.logseqRootPath || "_review_logseq");
    const journalFolder = normalizePath(`${rootPath}/journals`);
    const targetPath = normalizePath(
      `${journalFolder}/${this.buildJournalFileName(note.date)}`,
    );

    const templatePath = normalizePath(
      config.settings.review.logseqJournalTemplatePath || "_template/review-logseq-journal-template.md",
    );
    await this.ensureTemplateExists();
    const templateFile = this.app.vault.getAbstractFileByPath(templatePath) as TFile | null;
    if (!templateFile) {
      throw new Error(`Review template file not found: ${templatePath}`);
    }
    const template = await this.app.vault.read(templateFile);
    const content = this.fillTemplateWithSummaryList(template, note, summaryList);

    logger.debug(
      `[Service] ReviewPointLogseqJournalTemplateService.writeJournalContent target=${targetPath} bytes=${content.length}`,
    );
    await this.app.vault.adapter.write(targetPath, content);
  }

  buildDeepLink(date: string): string {
    const rootPath = normalizePath(config.settings.review.logseqRootPath || "_review_logseq");
    // 最後のセグメントをグラフ名として使用（例: "_review_logseq" -> "_review_logseq"）
    const segments = rootPath.split("/");
    const graphName = segments[segments.length - 1];
    // Logseq のページ名は YYYY-MM-DD
    return `logseq://graph/${graphName}?page=${date}`;
  }

  private async ensureFolder(path: string): Promise<void> {
    if (await this.app.vault.adapter.exists(path)) {
      return;
    }

    await this.app.vault.createFolder(path);
  }

  async ensureTemplateExists(): Promise<void> {
    const templatePath = normalizePath(
      config.settings.review.logseqJournalTemplatePath || "_templates/review-logseq-journal-template.md",
    );

    await this.ensureTemplateFolder(templatePath);

    if (!(await this.app.vault.adapter.exists(templatePath))) {
      const template = this.getDefaultTemplate();
      logger.debug(
        `[Service] ReviewPointLogseqJournalTemplateService.createDefaultTemplate target=${templatePath} bytes=${template.length}`,
      );
      await this.app.vault.adapter.write(templatePath, template);
    }
  }

  private async buildJournalContent(
    note: DailyNote,
    doc?: DailyNotesReflectionDocument,
  ): Promise<string> {
    const templatePath = normalizePath(
      config.settings.review.logseqJournalTemplatePath || "_templates/review-logseq-journal-template.md",
    );

    await this.ensureTemplateExists();

    const templateFile = this.app.vault.getAbstractFileByPath(templatePath) as TFile | null;
    if (!templateFile) {
      throw new Error(`Review template file not found: ${templatePath}`);
    }

    const template = await this.app.vault.read(templateFile);

    return this.fillTemplate(template, note, doc);
  }

  private getDefaultTemplate(): string {
    return [
      "- Fact",
      "    {{NoteSummaryList}}",
      "- KPT",
      "    - Keep",
      "    - Problem",
      "    - Try",
    ].join("\n");
  }

  private fillTemplate(
    template: string,
    note: DailyNote,
    doc?: DailyNotesReflectionDocument,
  ): string {
    const summaryList = doc ? this.buildNoteSummaryList(doc) : "";
    return this.fillTemplateWithSummaryList(template, note, summaryList);
  }

  private fillTemplateWithSummaryList(
    template: string,
    note: DailyNote,
    summaryList: string,
  ): string {
    return this.replaceWithIndent(
      this.replaceWithIndent(
        this.replaceWithIndent(template, "{{当日ノート要約リスト}}", summaryList),
        "{{NoteSummaryList}}",
        summaryList,
      ),
      "{{noteSummaryList}}",
      summaryList,
    )
      .replace(/\{\{date\}\}/g, note.date)
      .replace(/\{\{date_underscore\}\}/g, this.buildJournalFileName(note.date));
  }

  private replaceWithIndent(
    template: string,
    placeholder: string,
    replacement: string,
  ): string {
    const placeholderPattern = new RegExp(`(^|\\n)([ \\t]*)${placeholder}`, "g");

    return template.replace(
      placeholderPattern,
      (match: string, prefix: string, indentation: string) =>
        `${prefix}${this.indentMultiline(replacement, indentation)}`,
    );
  }

  private indentMultiline(text: string, indentation: string): string {
    if (!indentation) {
      return text;
    }

    return text
      .split("\n")
      .map((line) => `${indentation}${line}`)
      .join("\n");
  }

  private buildNoteSummaryList(doc: DailyNotesReflectionDocument): string {
    const lines: string[] = [];

    for (const project of doc.projects) {
      lines.push(`- ${project.projectTitle}`);

      for (const note of project.notes) {
        lines.push(`    - ${note.noteTitle}`);

        for (const sentence of note.sentences) {
          lines.push(`        - ${sentence.text}`);
        }
      }
    }

    return lines.join("\n");
  }

  private buildJournalFileName(date: string): string {
    return `${date.replace(/-/g, "_")}.md`;
  }

  private async ensureTemplateFolder(templatePath: string): Promise<void> {
    const folderPath = templatePath.includes("/")
      ? templatePath.slice(0, templatePath.lastIndexOf("/"))
      : "";

    if (folderPath) {
      await this.ensureFolder(folderPath);
    }
  }
}

function encodeLinkDestination(value: string): string {
  return value
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}
