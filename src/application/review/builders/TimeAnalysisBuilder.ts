import { ReviewTaskTree } from "../models/ReviewTaskTree";

export class TimeAnalysisBuilder {
  build(tree: ReviewTaskTree): string {
    const byTag = tree.aggregatePomodoroByTag();
    const unfinished = tree.aggregateUnfinishedPomodoro();

    if (byTag.size === 0 && unfinished.planned === 0 && unfinished.actual === 0) {
      return `- (time analysis: no tags)`;
    }

    const lines: string[] = [];
    lines.push(`- (time analysis by tag)`);

    const tags = Array.from(byTag.keys()).sort((a, b) => a.localeCompare(b));

    for (const tag of tags) {
      const { planned, actual } = byTag.get(tag)!;

      const plannedDisplay = planned === 0 ? "-" : planned.toString();
      const actualDisplay =
        actual === 0 ? "0.0" : (Math.round(actual * 10) / 10).toFixed(1);

      lines.push(`  - ${tag}: 🍅${plannedDisplay}/${actualDisplay}`);
    }

    if (unfinished.planned > 0 || unfinished.actual > 0) {
      const plannedDisplay =
        unfinished.planned === 0 ? "-" : unfinished.planned.toString();
      const actualDisplay =
        unfinished.actual === 0
          ? "0.0"
          : (Math.round(unfinished.actual * 10) / 10).toFixed(1);

      lines.push(`  - 未完了: 🍅${plannedDisplay}/${actualDisplay}`);
    }

    return lines.join("\n").trim();
  }
}
