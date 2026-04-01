import { TFile } from "obsidian";
import { config } from "../../../config/config";
import { ProjectFolder } from "../../../domain/project/ProjectFolder";
import { ProjectIndexDocumentAdapter } from "../../../infrastructure/document/adapter/ProjectIndexDocumentAdapter";
import { ProjectIndexBasesTemplateBuilder } from "../../../infrastructure/document/project/ProjectIndexBasesTemplateBuilder";
import { ProjectRepository } from "../../../infrastructure/repository/ProjectRepository";

export class EnsureProjectIndexBasesSectionUseCase {
  constructor(
    private readonly repository: ProjectRepository,
    private readonly basesTemplateBuilder: ProjectIndexBasesTemplateBuilder,
    private readonly isBasesPluginEnabled: () => boolean,
  ) {}

  async execute(file: TFile | null): Promise<boolean> {
    if (!file || !this.shouldHandle(file.path)) {
      return false;
    }

    const content = await this.repository.read(file);
    const adapter = new ProjectIndexDocumentAdapter(content);
    const folder = new ProjectFolder(this.resolveFolderPath(file.path));
    const updated = adapter.upsertBasesSection(this.basesTemplateBuilder.build(folder));

    if (!updated) {
      return false;
    }

    await this.repository.saveFile(file, adapter.toString());
    return true;
  }

  private shouldHandle(path: string): boolean {
    if (!config.settings.projectIndex.enabled || !config.settings.projectIndex.enableBasesSection) {
      return false;
    }

    if (!this.isBasesPluginEnabled()) {
      return false;
    }

    if (!path.endsWith("/index.md")) {
      return false;
    }

    const folderPath = this.resolveFolderPath(path);
    return ProjectFolder.isProjectFolderPath(folderPath);
  }

  private resolveFolderPath(path: string): string {
    return path.replace(/\/index\.md$/i, "");
  }
}
