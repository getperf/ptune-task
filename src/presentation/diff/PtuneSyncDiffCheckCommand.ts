import { DiffDailyNoteUseCase } from "../../application/sync/diff/DiffDailyNoteUseCase";
import { DiffResult } from "../../application/sync/shared/dto/DiffResult";
import { logger } from "../../shared/logger/loggerInstance";

export interface PtuneSyncDiffCheckPresenter {
  showInfo(message: string): void;
  showError(message: string): void;
}

export class PtuneSyncDiffCheckCommand {
  constructor(
    private readonly useCase: DiffDailyNoteUseCase,
    private readonly presenter: PtuneSyncDiffCheckPresenter,
  ) {}

  async execute(): Promise<void> {
    logger.debug("[Command:start] PtuneSyncDiffCheckCommand");

    try {
      const { result } = await this.useCase.execute();
      this.presenter.showInfo(this.buildMessage(result));
      logger.debug("[Command:end] PtuneSyncDiffCheckCommand");
    } catch (err) {
      logger.error("[Command] PtuneSyncDiffCheckCommand failed", err);
      this.presenter.showError(String(err));
    }
  }

  private buildMessage(result: DiffResult): string {
    if (!result.success) {
      return `Diff check failed: ${result.errorMessage ?? "unknown error"}`;
    }

    return [
      "Diff check",
      `create=${result.summary.create}`,
      `update=${result.summary.update}`,
      `delete=${result.summary.delete}`,
      `warnings=${result.summary.warnings}`,
      `errors=${result.summary.errors}`,
    ].join(" ");
  }
}
