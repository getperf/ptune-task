import { DailyNote } from "../../../domain/daily/DailyNote";
import { DailyNoteRepository } from "../../../infrastructure/repository/DailyNoteRepository";
import { DailyNoteCreator } from "../services/DailyNoteCreator";
import { logger } from "../../../shared/logger/loggerInstance";

export class CreateDailyNoteUseCase {
  constructor(
    private readonly repository: DailyNoteRepository,
    private readonly creator: DailyNoteCreator,
  ) {}

  async execute(date: string): Promise<{ note: DailyNote; created: boolean }> {
    logger.debug(`[UseCase:start] CreateDailyNoteUseCase date=${date}`);
    const existing = await this.repository.findByDate(date);

    if (existing) {
      logger.debug(`[UseCase:end] CreateDailyNoteUseCase date=${date} created=false existing=true`);
      return { note: existing, created: false };
    }

    const note = this.creator.create(date);

    await this.repository.save(note);

    logger.debug(`[UseCase:end] CreateDailyNoteUseCase date=${date} created=true existing=false`);
    return { note, created: true };
  }
}
