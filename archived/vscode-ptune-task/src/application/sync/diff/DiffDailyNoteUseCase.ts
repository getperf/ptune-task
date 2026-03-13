import { DailyNoteRepository } from "../../../infrastructure/repository/DailyNoteRepository";
import { Logger } from "../../../shared/logger/Logger";
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
    const logger = Logger.get();
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
