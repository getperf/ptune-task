import { ReviewDailyTrendStat } from "../dto/ReviewDailyTrendStat";

export class WeeklyTrendTableBuilder {
  build(stats: ReviewDailyTrendStat[]): string {
    if (stats.length === 0) {
      return "- (weekly trend: no data)";
    }

    const lines = [
      "| 日付 | タスク | 完了 | 予定🍅 | 実績✅ | バー |",
      "| --- | ---: | ---: | ---: | ---: | --- |",
    ];

    for (const stat of stats) {
      lines.push(
        [
          "|",
          ` ${this.formatDate(stat.date)} |`,
          ` ${stat.taskCount} |`,
          ` ${this.formatCompleted(stat)} |`,
          ` ${this.formatNumber(stat.plannedTotal)} |`,
          ` ${this.formatNumber(stat.actualTotal)} |`,
          ` ${this.buildBar(stat)} |`,
        ].join(""),
      );
    }

    return lines.join("\n").trim();
  }

  private formatDate(value: string): string {
    return value.length >= 10 ? value.slice(5) : value;
  }

  private formatCompleted(stat: ReviewDailyTrendStat): string {
    const unfinished = Math.max(0, stat.taskCount - stat.completedCount);
    if (unfinished <= 0) {
      return stat.completedCount.toString();
    }

    return `${stat.completedCount} <span style="color: var(--text-error);">(-${unfinished})</span>`;
  }

  private formatNumber(value: number): string {
    if (value === 0) {
      return "0";
    }

    return Number.isInteger(value)
      ? value.toString()
      : (Math.round(value * 10) / 10).toFixed(1);
  }

  private buildBar(stat: ReviewDailyTrendStat): string {
    const planned = stat.plannedTotal;
    const actual = stat.actualTotal;

    if (planned <= 0 && actual <= 0) {
      return "";
    }

    if (planned <= 0) {
      return `${"+".repeat(Math.max(1, Math.min(10, Math.round(actual))))} (+${this.formatNumber(actual)})`;
    }

    const baseWidth = 10;
    const consumedWithinPlan = Math.min(actual, planned);
    const filled = Math.max(
      0,
      Math.min(baseWidth, Math.round((consumedWithinPlan / planned) * baseWidth)),
    );
    const empty = Math.max(0, baseWidth - filled);
    const over = actual > planned
      ? Math.max(1, Math.min(baseWidth, Math.round(((actual - planned) / planned) * baseWidth)))
      : 0;
    const diff = Math.round((actual - planned) * 10) / 10;
    const diffLabel = diff === 0
      ? "(±0)"
      : diff > 0
        ? `(+${this.formatNumber(diff)})`
        : `(${this.formatNumber(diff)})`;

    return `${"█".repeat(filled)}${"░".repeat(empty)}${"+".repeat(over)} ${diffLabel}`.trim();
  }
}
