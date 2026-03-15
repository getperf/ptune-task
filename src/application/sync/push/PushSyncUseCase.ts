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
    logger.debug(`[UseCase:start] PushSyncUseCase allowDelete=${allowDelete}`);

    const { payload, result } = await this.diffUseCase.execute();

    logger.debug(
      `[UseCase] PushSyncUseCase diffReady payloadBytes=${payload.length} create=${result.summary.create} update=${result.summary.update} delete=${result.summary.delete} errors=${result.summary.errors} warnings=${result.summary.warnings}`,
    );

    // 🔹 バリデーション失敗は例外にしない
    if (result.isValidationFailure()) {
      logger.warn(`[UseCase] PushSyncUseCase validationFailure errors=${result.errors.length}`, result.errors);
      return result;
    }

    // 🔹 summary取得
    const summary = result.summary;

    // 🔹 errorsがあればpush不可
    if (result.hasErrors()) {
      logger.warn(`[UseCase] PushSyncUseCase blockedByErrors errors=${result.errors.length}`, result.errors);
      return result;
    }

    const confirmed = await this.confirmPort.confirm(summary);
    logger.debug(`[UseCase] PushSyncUseCase confirmed=${confirmed}`);

    if (!confirmed) {
      logger.info("[UseCase:end] PushSyncUseCase cancelledByUser");
      return false;
    }

    await this.pushUseCase.execute(payload, allowDelete);

    logger.debug("[UseCase:end] PushSyncUseCase pushed=true");

    return result;
  }
}
