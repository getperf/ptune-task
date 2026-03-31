import { App, Setting } from "obsidian";
import { config } from "./config";
import { DailyNoteTaskTemplateModal } from "./DailyNoteTaskTemplateModal";
import { createEmptyDailyNoteTaskSettings } from "./dailyNoteTaskTemplates";
import { i18n } from "../shared/i18n/I18n";

export function renderDailyNoteTaskSettings(
  containerEl: HTMLElement,
  app: App,
  onSettingsChanged: () => void,
) {
  const t = i18n.settings.dailyNoteTask;

  containerEl.createEl("h2", { text: t.sectionTitle });
  renderTemplateManager(containerEl, app, onSettingsChanged);

  renderHabitSettings(containerEl);
  renderTagSuggestions(containerEl);
  renderGoalSuggestions(containerEl);
  renderSubTaskTemplates(containerEl);
}

function renderTemplateManager(
  containerEl: HTMLElement,
  app: App,
  onSettingsChanged: () => void,
) {
  const t = i18n.settings.dailyNoteTask.templateManager;

  new Setting(containerEl)
    .setName(t.name)
    .setDesc(t.desc)
    .addButton((button) =>
      button
        .setButtonText(t.open)
        .onClick(() => {
          new DailyNoteTaskTemplateModal(app, onSettingsChanged).open();
        }),
    );
}

function renderHabitSettings(containerEl: HTMLElement) {
  const t = i18n.settings.dailyNoteTask.habit;

  new Setting(containerEl)
    .setName(t.morning.name)
    .setDesc(t.morning.desc)
    .addTextArea((text) => {
      text
        .setPlaceholder(t.morning.placeholder)
        .setValue(
          config.settings.dailyNoteTask?.habit.morning.join("\n") ?? ""
        )
        .onChange(async (value) => {
          if (!config.settings.dailyNoteTask) {
            config.settings.dailyNoteTask = createEmptyDailyNoteTaskSettings();
          }
          config.settings.dailyNoteTask.habit.morning = value
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter(Boolean);
          await config.save();
        });

      text.inputEl.rows = 3;
    });

  new Setting(containerEl)
    .setName(t.evening.name)
    .setDesc(t.evening.desc)
    .addTextArea((text) => {
      text
        .setPlaceholder(t.evening.placeholder)
        .setValue(
          config.settings.dailyNoteTask?.habit.evening.join("\n") ?? ""
        )
        .onChange(async (value) => {
          if (!config.settings.dailyNoteTask) {
            config.settings.dailyNoteTask = createEmptyDailyNoteTaskSettings();
          }
          config.settings.dailyNoteTask.habit.evening = value
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter(Boolean);
          await config.save();
        });

      text.inputEl.rows = 3;
    });
}

function renderTagSuggestions(containerEl: HTMLElement) {
  const t = i18n.settings.dailyNoteTask.tagSuggestions;

  new Setting(containerEl)
    .setName(t.name)
    .setDesc(t.desc)
    .addTextArea((text) => {
      text
        .setPlaceholder(t.placeholder)
        .setValue(
          config.settings.dailyNoteTask?.tagSuggestions.join("\n") ?? ""
        )
        .onChange(async (value) => {
          if (!config.settings.dailyNoteTask) {
            config.settings.dailyNoteTask = createEmptyDailyNoteTaskSettings();
          }
          config.settings.dailyNoteTask.tagSuggestions = value
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter(Boolean);
          await config.save();
        });

      text.inputEl.rows = 4;
    });
}

function renderGoalSuggestions(containerEl: HTMLElement) {
  const t = i18n.settings.dailyNoteTask.goalSuggestions;

  new Setting(containerEl)
    .setName(t.name)
    .setDesc(t.desc)
    .addTextArea((text) => {
      text
        .setPlaceholder(t.placeholder)
        .setValue(
          config.settings.dailyNoteTask?.goalSuggestions.join("\n") ?? ""
        )
        .onChange(async (value) => {
          if (!config.settings.dailyNoteTask) {
            config.settings.dailyNoteTask = createEmptyDailyNoteTaskSettings();
          }
          config.settings.dailyNoteTask.goalSuggestions = value
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter(Boolean);
          await config.save();
        });

      text.inputEl.rows = 5;
    });
}

function renderSubTaskTemplates(containerEl: HTMLElement) {
  const t = i18n.settings.dailyNoteTask.subTaskTemplates;

  new Setting(containerEl)
    .setName(t.name)
    .setDesc(t.desc)
    .addTextArea((text) => {
      text
        .setPlaceholder(t.placeholder)
        .setValue(
          config.settings.dailyNoteTask?.subTaskTemplates.join("\n") ?? ""
        )
        .onChange(async (value) => {
          if (!config.settings.dailyNoteTask) {
            config.settings.dailyNoteTask = createEmptyDailyNoteTaskSettings();
          }
          config.settings.dailyNoteTask.subTaskTemplates = value
            .split(/\r?\n/)
            .map((s) => s.trim())
            .filter(Boolean);
          await config.save();
        });

      text.inputEl.rows = 6;
    });
}
