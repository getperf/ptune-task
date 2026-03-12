import { DailyNoteRepository } from "../../../infrastructure/repository/DailyNoteRepository";
import { logger } from "../../../shared/logger/loggerInstance";
import { MarkdownToJsonUseCase } from "../../planning/usecases/MarkdownToJsonUseCase";
import { DiffResult } from "../shared/dto/DiffResult";
import { PtuneSyncPort } from "../shared/ports/PtuneSyncPort";

export interface DiffExecutionResult {
  payload: string;
  result: DiffResult;
}

export class DiffDailyNoteUseCase {
  constructor(
    private readonly repository: DailyNoteRepository,
    private readonly syncPort: PtuneSyncPort,
  ) {}

  async execute(): Promise<DiffExecutionResult> {
    logger.info("Diff started");

    const note = await this.repository.getActive();
    const payload = MarkdownToJsonUseCase.execute(note.content);

    const result = await this.syncPort.diff(payload);

    if (result.isValidationFailure()) {
      logger.warn("Diff validation failed", result.errors);
    } else {
      logger.info("Diff completed");
    }

    return { payload, result };
  }
}
