import { HabitService } from "../../../domain/planning/HabitService";
import { PtuneRuntime } from "../../../shared/PtuneRuntime";
import { i18n } from "../../../shared/i18n/I18n";

export interface PlannedTaskSectionOptions {
  commentLine1: string;
  commentLine2: string;
  tasksMarkdown?: string;
  morningHabits: string[];
  eveningHabits: string[];
  keepExistingHabits: boolean;
}

export interface PlannedTaskSectionTodayOptions {
  tasksMarkdown?: string;
  keepExistingHabits: boolean;
  runtime: PtuneRuntime;
}

export class PlannedTaskSectionBuilder {
  static build(options: PlannedTaskSectionOptions): string {
    const lines: string[] = [];

    lines.push("<!--", options.commentLine1, options.commentLine2, "-->", "");

    const taskLines = options.tasksMarkdown
      ? options.tasksMarkdown.split("\n")
      : [];

    if (options.keepExistingHabits) {
      lines.push(...taskLines);
    } else {
      lines.push(...HabitService.buildHabitLines(options.morningHabits));

      lines.push(...taskLines);

      lines.push(...HabitService.buildHabitLines(options.eveningHabits));
    }

    lines.push("");

    return lines.join("\n");
  }

  static buildForToday(options: PlannedTaskSectionTodayOptions): string {
    const habits = options.runtime.getHabitTasks();

    return this.build({
      commentLine1: i18n.t("daily.section.planned.comment.line1"),

      commentLine2: i18n.t("daily.section.planned.comment.line2"),

      tasksMarkdown: options.tasksMarkdown,

      morningHabits: habits.morning,

      eveningHabits: habits.evening,

      keepExistingHabits: options.keepExistingHabits,
    });
  }
}
