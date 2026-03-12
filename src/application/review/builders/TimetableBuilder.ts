import { ReviewFlagLabelResolver } from "../services/ReviewFlagLabelResolver";
import { ReviewTaskNode } from "../models/ReviewTaskNode";
import { ReviewTaskTree } from "../models/ReviewTaskTree";

export class TimetableBuilder {
  constructor(private readonly flagResolver: ReviewFlagLabelResolver) {}

  build(tree: ReviewTaskTree): string {
    const lines: string[] = [];

    const visit = (node: ReviewTaskNode, depth: number) => {
      const indent = "  ".repeat(depth);

      const statusIcon = this.resolveStatusIcon(node.status ?? undefined);
      const timeRange = this.formatTimeRange(
        node.started ?? undefined,
        node.completed ?? undefined,
      );
      const timePart = timeRange ? `${timeRange} ` : "";
      const pomodoro = this.formatPomodoro(
        node.pomodoroPlanned ?? undefined,
        node.pomodoroActual ?? undefined,
      );
      const meta = this.formatMeta(node);

      lines.push(
        `${indent}- ${statusIcon} ${timePart}${node.title}${pomodoro}${meta}`,
      );

      for (const child of node.children) {
        visit(child, depth + 1);
      }
    };

    for (const root of tree.roots) {
      visit(root, 0);
    }

    return lines.join("\n").trim();
  }

  private formatMeta(node: ReviewTaskNode): string {
    const parts: string[] = [];

    if (node.goal) {
      parts.push(`🎯${node.goal}`);
    }

    if (node.reviewFlags.length > 0) {
      const labels = node.reviewFlags
        .map((flag) => this.flagResolver.resolve(flag))
        .filter(Boolean)
        .join(", ");

      if (labels) {
        parts.push(`⚠${labels}`);
      }
    }

    return parts.length === 0 ? "" : ` | ${parts.join(" | ")}`;
  }

  private resolveStatusIcon(status?: string): string {
    if (!status) return " ";
    if (status === "completed") return "✅";
    if (status === "needsAction") return "⏳";
    return "•";
  }

  private formatTimeRange(started?: string, completed?: string): string {
    if (!started && !completed) return "";
    const start = this.formatTime(started);
    const end = this.formatTime(completed);
    return `${start}-${end}`;
  }

  private formatTime(value?: string): string {
    if (!value) return "--:--";
    if (/^\d{2}:\d{2}$/.test(value)) return value;

    const date = new Date(value);
    if (isNaN(date.getTime())) return "--:--";

    const hh = String(date.getHours()).padStart(2, "0");
    const mm = String(date.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
  }

  private formatPomodoro(planned?: number, actual?: number): string {
    const p = planned ?? 0;
    const a = actual ?? 0;

    // 両方 0 → 非表示
    if (p === 0 && a === 0) {
      return "";
    }

    // planned > 0 && actual === 0 → plannedのみ表示
    if (p > 0 && a === 0) {
      return ` 🍅${p}`;
    }

    // planned > 0 && actual > 0 → 両方表示
    if (p > 0 && a > 0) {
      const actualDisplay = (Math.round(a * 10) / 10).toFixed(1);
      return ` 🍅${p}/${actualDisplay}`;
    }

    // planned 0 && actual > 0 → 実績のみ
    if (p === 0 && a > 0) {
      const actualDisplay = (Math.round(a * 10) / 10).toFixed(1);
      return ` 🍅-/${actualDisplay}`;
    }

    return "";
  }
}
