import { App } from "obsidian";
import { MarkdownFile } from "md-ast-core";
import { config } from "../../../config/config";
import { ProjectFolder } from "../../../domain/project/ProjectFolder";
import { ProjectIndexDocumentAdapter } from "../adapter/ProjectIndexDocumentAdapter";
import { ProjectIndexBasesTemplateBuilder } from "./ProjectIndexBasesTemplateBuilder";

export class ProjectIndexBuilder {
  constructor(
    private readonly app: App,
    private readonly basesTemplateBuilder: ProjectIndexBasesTemplateBuilder,
  ) {}

  build(folder: ProjectFolder, createdAt: string): string {
    const md = MarkdownFile.createEmpty();
    const frontmatter = md.getFrontmatter();

    frontmatter.set("created", createdAt);
    frontmatter.set("updated", createdAt);

    if (folder.taskKey) {
      frontmatter.set("taskKey", folder.taskKey);
    }

    md.root().appendChild({
      title: folder.title,
      depth: 1,
      content: () => "",
    });

    const markdown = md.toString();
    if (!this.shouldIncludeBasesSection()) {
      return markdown;
    }

    const adapter = new ProjectIndexDocumentAdapter(markdown);
    adapter.upsertBasesSection(this.basesTemplateBuilder.build(folder));
    return adapter.toString();
  }

  private shouldIncludeBasesSection(): boolean {
    return config.settings.projectIndex.enabled
      && config.settings.projectIndex.enableBasesSection
      && (this.app.internalPlugins?.plugins?.bases?.enabled ?? false);
  }
}
