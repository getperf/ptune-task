import { TodayResolver } from "../../application/calendar/services/TodayResolver";
import { ReviewQuery } from "../../application/sync/shared/dto/ReviewQuery";
import { PtuneSyncClient } from "../../infrastructure/sync/shared/PtuneSyncClient";
import { logger } from "../../shared/logger/loggerInstance";

type ReviewCheckData = {
  date?: string;
  list?: string;
  tasks?: unknown[];
  meta?: {
    task_count?: number;
    sync_history_id?: string;
    snapshot_at?: string;
    source?: string;
  };
};

export interface PtuneSyncReviewCheckPresenter {
  showInfo(message: string): void;
  showError(message: string): void;
}

export class PtuneSyncReviewCheckCommand {
  constructor(
    private readonly todayResolver: TodayResolver,
    private readonly client: PtuneSyncClient,
    private readonly presenter: PtuneSyncReviewCheckPresenter,
    private readonly list = "_Today",
  ) {}

  async execute(): Promise<void> {
    logger.debug("[Command:start] PtuneSyncReviewCheckCommand");

    try {
      const query: ReviewQuery = {
        list: this.list,
        preset: "date",
        date: this.todayResolver.resolve(),
      };
      const envelope = await this.client.review<ReviewCheckData>(query);
      this.presenter.showInfo(this.buildMessage(envelope.data, query));
      logger.debug("[Command:end] PtuneSyncReviewCheckCommand");
    } catch (err) {
      logger.error("[Command] PtuneSyncReviewCheckCommand failed", err);
      this.presenter.showError(String(err));
    }
  }

  private buildMessage(
    data: ReviewCheckData | undefined,
    query: ReviewQuery,
  ): string {
    const taskCount = data?.meta?.task_count ?? data?.tasks?.length ?? 0;
    const date = data?.date ?? query.date ?? this.todayResolver.resolve();
    const list = data?.list ?? query.list;
    const snapshotAt = data?.meta?.snapshot_at ?? "-";
    const syncHistoryId = data?.meta?.sync_history_id ?? "-";

    return [
      "Review check",
      `date=${date}`,
      `list=${list}`,
      `tasks=${taskCount}`,
      `snapshot=${snapshotAt}`,
      `sync=${syncHistoryId}`,
    ].join(" ");
  }
}
