import { SyncPhase } from "../../../domain/sync/SyncPhase";
import { Logger } from "../../../shared/logger/Logger";
import { PtuneSyncPort } from "../shared/ports/PtuneSyncPort";

export class ApplyPushUseCase {
  constructor(private readonly syncPort: PtuneSyncPort) { }

  async execute(payload: string, allowDelete: boolean): Promise<void> {
    const logger = Logger.get();
    logger.info("Push started");

    try {
      await this.syncPort.push(payload, { list: "_Today", allowDelete });

      logger.info("Push completed");
    } catch (error) {
      logger.error("Push failed", error);
      throw error;
    }
  }
}
