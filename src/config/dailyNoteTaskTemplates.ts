import type { DailyNoteTaskSettings } from "./types";

export type DailyNoteTaskTemplateId = "software-development";

export interface DailyNoteTaskTemplateDefinition {
  id: DailyNoteTaskTemplateId;
  settings: DailyNoteTaskSettings;
}

export const DEFAULT_HABIT_TASKS = {
  morning: ["<朝>起床🚫"],
  evening: ["<夜>就寝🚫"],
} as const;

export const DAILY_NOTE_TASK_TEMPLATES: DailyNoteTaskTemplateDefinition[] = [
  {
    id: "software-development",
    settings: {
      habit: {
        morning: [],
        evening: [],
      },
      tagSuggestions: ["設計", "調査", "試作", "実装", "検証"],
      goalSuggestions: [
        "仕様確定",
        "設計整理完了",
        "実装完了",
        "テスト追加完了",
        "リファクタリング完了",
        "バグ修正完了",
      ],
      subTaskTemplates: [
        "要件整理 #設計 🍅x1",
        "ユースケース #設計 🍅x1",
        "変更調査 #調査 🍅x1",
        "プロトタイプ #実装 🍅x1",
        "バグ修正 #実装 🍅x1",
        "レビュー #検証 🍅x1",
        "リグレッション #検証 🍅x1",
      ],
    },
  },
];

export function createEmptyDailyNoteTaskSettings(): DailyNoteTaskSettings {
  return {
    habit: {
      morning: [],
      evening: [],
    },
    tagSuggestions: [],
    goalSuggestions: [],
    subTaskTemplates: [],
  };
}

export function cloneDailyNoteTaskSettings(
  settings: DailyNoteTaskSettings,
): DailyNoteTaskSettings {
  return {
    habit: {
      morning: [...settings.habit.morning],
      evening: [...settings.habit.evening],
    },
    tagSuggestions: [...settings.tagSuggestions],
    goalSuggestions: [...settings.goalSuggestions],
    subTaskTemplates: [...settings.subTaskTemplates],
  };
}

export function findDailyNoteTaskTemplate(
  id: DailyNoteTaskTemplateId,
): DailyNoteTaskTemplateDefinition | undefined {
  return DAILY_NOTE_TASK_TEMPLATES.find((template) => template.id === id);
}

export function createDefaultHabitTaskSettings(): DailyNoteTaskSettings["habit"] {
  return {
    morning: [...DEFAULT_HABIT_TASKS.morning],
    evening: [...DEFAULT_HABIT_TASKS.evening],
  };
}
