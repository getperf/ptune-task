import { logger } from "../../../shared/logger/loggerInstance";
import { DiffResult } from "../shared/dto/DiffResult";
import { DiffDailyNoteUseCase } from "../diff/DiffDailyNoteUseCase";
import { ApplyPushUseCase } from "./ApplyPushUseCase";

export interface ConfirmPort {
  confirm(summary: {
    create: number;
    update: number;
    delete: number;
    errors: number;
    warnings: number;
  }): Promise<boolean>;
}

export class PushSyncUseCase {
  constructor(
    private readonly diffUseCase: DiffDailyNoteUseCase,
    private readonly pushUseCase: ApplyPushUseCase,
    private readonly confirmPort: ConfirmPort,
  ) { }

  async execute(allowDelete: boolean): Promise<DiffResult | false> {
    logger.info("Sync started");

    const { payload, result } = await this.diffUseCase.execute();

    logger.debug("Diff executed");

    // 🔹 バリデーション失敗は例外にしない
    if (result.isValidationFailure()) {
      logger.warn("Diff validation failure", result.errors);
      return result;
    }

    // 🔹 summary取得
    const summary = result.summary;

    // 🔹 errorsがあればpush不可
    if (result.hasErrors()) {
      logger.warn("Diff contains errors", result.errors);
      return result;
    }

    const confirmed = await this.confirmPort.confirm(summary);

    if (!confirmed) {
      logger.info("Sync cancelled by user");
      return false;
    }

    await this.pushUseCase.execute(payload, allowDelete);

    logger.info("Sync completed");

    return result;
  }
}
