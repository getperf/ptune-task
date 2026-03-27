import { logger } from "../../shared/logger/loggerInstance";
import { ObsidianPresenter } from "../../infrastructure/obsidian/ObsidianPresenter";
import { PtuneTaskRunCleanupService } from "../../infrastructure/sync/ptune-task-uri/PtuneTaskRunCleanupService";

export class CleanupSyncRunsCommand {
  constructor(
    private readonly service: PtuneTaskRunCleanupService,
    private readonly presenter: ObsidianPresenter,
  ) {}

  async execute(): Promise<void> {
    logger.debug("[Command:start] CleanupSyncRunsCommand");

    try {
      const summary = await this.service.cleanupNow();
      this.presenter.showInfo(
        `Sync runs cleaned: removed=${summary.removed} kept=${summary.kept} profile=${summary.profile}`,
      );
      logger.debug(
        `[Command:end] CleanupSyncRunsCommand removed=${summary.removed} kept=${summary.kept} profile=${summary.profile}`,
      );
    } catch (error) {
      logger.error("[Command] CleanupSyncRunsCommand failed", error);
      this.presenter.showError(String(error));
    }
  }
}
