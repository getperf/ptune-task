import { ReviewQuery } from "../../sync/shared/dto/ReviewQuery";
import { CreateDailyNoteUseCase } from "../../calendar/usecases/CreateDailyNoteUseCase";
import { DailyNoteRepository } from "../../../infrastructure/repository/DailyNoteRepository";
import { ReviewSectionWriter } from "../../../infrastructure/document/review/ReviewSectionWriter";
import { ReviewTaskDto } from "../dto/ReviewTaskDto";
import { ReviewDailyTrendStat } from "../dto/ReviewDailyTrendStat";
import { logger } from "../../../shared/logger/loggerInstance";
import { DailyNote } from "../../../domain/daily/DailyNote";
import { DailyNoteDocumentAdapter } from "../../../infrastructure/document/adapter/DailyNoteDocumentAdapter";
import { ReviewTaskTree } from "../models/ReviewTaskTree";
import { PtuneSyncPort } from "../../sync/shared/ports/PtuneSyncPort";
import { config } from "../../../config/config";

export type GenerateReviewResult = {
  note: DailyNote;
  taskCount: number;
};

type ReviewResponse = {
  schema_version: number;
  list: string;
  exported_at: string;
  tasks: ReviewTaskDto[];
};

export class GenerateDailyReviewUseCase {
  constructor(
    private readonly ptuneSync: PtuneSyncPort,
    private readonly repository: DailyNoteRepository,
    private readonly createDailyNoteUseCase: CreateDailyNoteUseCase,
  ) {}

  async execute(date: string, list: string): Promise<GenerateReviewResult> {
    logger.info("GenerateDailyReviewUseCase started");

    // 1) review 取得
    const json = await this.ptuneSync.review({
      preset: "date",
      date,
      list,
    } as ReviewQuery);
    const parsed = JSON.parse(json) as ReviewResponse;

    const tasks = parsed.tasks ?? [];
    const tree = ReviewTaskTree.fromDtos(tasks);
    const trendStats = await this.loadTrendStats(date, list);

    // 2) アクティブノート取得
    const { note } = await this.createDailyNoteUseCase.execute(date);

    // 3) セクション生成＆適用
    const now = new Date().toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });

    const adapter = new DailyNoteDocumentAdapter(note.content);
    const writer = new ReviewSectionWriter(adapter);

    writer.appendReview(tree, now, trendStats);

    // 4) 保存
    const updatedNote = note.withContent(adapter.toString());
    await this.repository.save(updatedNote);

    logger.info(
      `GenerateDailyReviewUseCase completed: ${tasks.length} tasks`,
    );

    return { note: updatedNote, taskCount: tasks.length };
  }

  private async loadTrendStats(
    targetDate: string,
    list: string,
  ): Promise<ReviewDailyTrendStat[]> {
    const stats: ReviewDailyTrendStat[] = [];
    const trendDays = Math.min(30, Math.max(1, config.settings.review.reviewTrendDays ?? 7));

    for (let offset = trendDays - 1; offset >= 0; offset--) {
      const date = this.shiftDate(targetDate, -offset);
      const json = await this.ptuneSync.review({
        preset: "date",
        date,
        list,
      } as ReviewQuery);
      const parsed = JSON.parse(json) as ReviewResponse;
      const tasks = parsed.tasks ?? [];

      stats.push({
        date,
        taskCount: tasks.length,
        completedCount: tasks.filter((task) => task.status === "completed").length,
        plannedTotal: tasks.reduce(
          (sum, task) => sum + (task.pomodoro_planned ?? 0),
          0,
        ),
        actualTotal: tasks.reduce(
          (sum, task) => sum + (task.pomodoro_actual ?? 0),
          0,
        ),
      });
    }

    return stats;
  }

  private shiftDate(baseDate: string, deltaDays: number): string {
    const date = new Date(`${baseDate}T00:00:00`);
    date.setDate(date.getDate() + deltaDays);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}
