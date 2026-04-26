import { App, normalizePath } from "obsidian";
import { config } from "../../config/config";

export class LogseqJournalTemplateSetupService {
  private static readonly DEFAULT_LOGSEQ_JOURNAL_TEMPLATE_PATH =
    "_templates/review-logseq-journal-template.md";

  private static readonly DEFAULT_LOGSEQ_JOURNAL_TEMPLATE = [
    "- Fact",
    "    {{NoteSummaryList}}",
    "- KPT",
    "    - Keep",
    "    - Problem",
    "    - Try",
  ].join("\n");

  constructor(private readonly app: App) { }

  async ensureTemplateExists(createdPaths: string[]): Promise<string | null> {
    const templatePath = normalizePath(
      config.settings.review.logseqJournalTemplatePath ||
      LogseqJournalTemplateSetupService.DEFAULT_LOGSEQ_JOURNAL_TEMPLATE_PATH,
    );

    await this.ensureTemplateFolder(templatePath, createdPaths);

    if (!(await this.app.vault.adapter.exists(templatePath))) {
      await this.app.vault.adapter.write(
        templatePath,
        LogseqJournalTemplateSetupService.DEFAULT_LOGSEQ_JOURNAL_TEMPLATE,
      );
      return templatePath;
    }

    return null;
  }

  private async ensureTemplateFolder(
    templatePath: string,
    createdPaths: string[],
  ): Promise<void> {
    const folderPath = templatePath.includes("/")
      ? templatePath.slice(0, templatePath.lastIndexOf("/"))
      : "";

    if (!folderPath) {
      return;
    }

    await this.ensureFolder(folderPath, createdPaths);
  }

  private async ensureFolder(
    path: string,
    createdPaths: string[],
  ): Promise<void> {
    if (await this.app.vault.adapter.exists(path)) {
      return;
    }

    await this.app.vault.createFolder(path);
    createdPaths.push(path);
  }
}
