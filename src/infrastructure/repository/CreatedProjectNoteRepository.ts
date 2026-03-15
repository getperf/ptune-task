import { App, TFile } from "obsidian";
import { MarkdownFile } from "md-ast-core";
import { ProjectFolder } from "../../domain/project/ProjectFolder";

export class CreatedProjectNoteRepository {
  constructor(private readonly app: App) {}

  findByDate(date: string): TFile[] {
    return this.app.vault.getMarkdownFiles().filter((file) => {
      if (!file.path.startsWith(`${ProjectFolder.rootDir}/`)) {
        return false;
      }

      if (file.basename === "index") {
        return false;
      }

      const frontmatter = this.app.metadataCache.getFileCache(file)?.frontmatter;
      const dailynote = typeof frontmatter?.dailynote === "string"
        ? frontmatter.dailynote
        : null;

      if (dailynote?.includes(date)) {
        return true;
      }

      const createdAt = typeof frontmatter?.createdAt === "string"
        ? frontmatter.createdAt
        : typeof frontmatter?.created === "string"
          ? frontmatter.created
          : null;

      return createdAt?.startsWith(date) ?? false;
    });
  }

  async hasSummary(file: TFile): Promise<boolean> {
    const text = await this.app.vault.read(file);
    const summary = MarkdownFile.parse(text).getFrontmatter().get<string>("summary");
    return typeof summary === "string" && summary.trim().length > 0;
  }
}
