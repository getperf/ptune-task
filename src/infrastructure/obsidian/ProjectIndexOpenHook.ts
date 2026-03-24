import { App, Plugin, TFile } from "obsidian";
import { EnsureProjectIndexBasesSectionUseCase } from "../../application/project/usecases/EnsureProjectIndexBasesSectionUseCase";
import { logger } from "../../shared/logger/loggerInstance";

export class ProjectIndexOpenHook {
  constructor(
    private readonly app: App,
    private readonly useCase: EnsureProjectIndexBasesSectionUseCase,
  ) {}

  start(plugin: Plugin): void {
    this.app.workspace.onLayoutReady(() => {
      plugin.registerEvent(
        this.app.workspace.on("file-open", (file) => {
          void this.handleFileOpen(file);
        }),
      );
    });
  }

  private async handleFileOpen(file: TFile | null): Promise<void> {
    try {
      await this.useCase.execute(file);
    } catch (error) {
      logger.warn("ProjectIndexOpenHook failed", error);
    }
  }
}
