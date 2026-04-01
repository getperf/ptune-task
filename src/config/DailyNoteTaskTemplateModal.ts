import { App, Modal, Notice, Setting } from "obsidian";
import { config } from "./config";
import {
  DAILY_NOTE_TASK_TEMPLATES,
  cloneDailyNoteTaskSettings,
  createDefaultHabitTaskSettings,
  createEmptyDailyNoteTaskSettings,
  findDailyNoteTaskTemplate,
  type DailyNoteTaskTemplateId,
} from "./dailyNoteTaskTemplates";
import { i18n } from "../shared/i18n/I18n";

export class DailyNoteTaskTemplateModal extends Modal {
  private applyHabitTasks = true;
  private selectedTemplateId: DailyNoteTaskTemplateId =
    DAILY_NOTE_TASK_TEMPLATES[0]?.id ?? "software-development";

  constructor(
    app: App,
    private readonly onApplied: () => void,
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    const t = i18n.settings.dailyNoteTask.templateManager;

    contentEl.empty();
    contentEl.createEl("h3", { text: t.modal.title });
    contentEl.createEl("p", { text: t.modal.desc });

    new Setting(contentEl)
      .setName(t.modal.includeHabit.name)
      .setDesc(t.modal.includeHabit.desc)
      .addToggle((toggle) =>
        toggle
          .setValue(this.applyHabitTasks)
          .onChange((value) => {
            this.applyHabitTasks = value;
          }),
      );

    new Setting(contentEl)
      .setName(t.modal.template.name)
      .setDesc(t.modal.template.desc)
      .addDropdown((dropdown) => {
        const options = Object.fromEntries(
          DAILY_NOTE_TASK_TEMPLATES.map((template) => [
            template.id,
            t.options[template.id],
          ]),
        );

        dropdown
          .addOptions(options)
          .setValue(this.selectedTemplateId)
          .onChange((value) => {
            this.selectedTemplateId = value as DailyNoteTaskTemplateId;
          });
      });

    const buttonSetting = new Setting(contentEl);
    buttonSetting.addButton((button) =>
      button
        .setButtonText(t.modal.apply)
        .setCta()
        .onClick(async () => {
          await this.applySelectedTemplate();
        }),
    );
    buttonSetting.addButton((button) =>
      button
        .setButtonText(t.modal.clear)
        .onClick(async () => {
          await this.clearSettings();
        }),
    );
    buttonSetting.addButton((button) =>
      button
        .setButtonText(i18n.common.action.cancel)
        .onClick(() => this.close()),
    );
  }

  onClose(): void {
    this.contentEl.empty();
  }

  private async applySelectedTemplate(): Promise<void> {
    const template = findDailyNoteTaskTemplate(this.selectedTemplateId);
    if (!template) {
      new Notice(i18n.common.notice.failed);
      return;
    }

    const currentSettings =
      config.settings.dailyNoteTask ?? createEmptyDailyNoteTaskSettings();
    const nextSettings = cloneDailyNoteTaskSettings(template.settings);

    nextSettings.habit = this.applyHabitTasks
      ? createDefaultHabitTaskSettings()
      : {
          morning: [...currentSettings.habit.morning],
          evening: [...currentSettings.habit.evening],
        };

    config.settings.dailyNoteTask = nextSettings;
    await config.save();
    new Notice(i18n.settings.dailyNoteTask.templateManager.notice.applied);
    this.onApplied();
    this.close();
  }

  private async clearSettings(): Promise<void> {
    config.settings.dailyNoteTask = createEmptyDailyNoteTaskSettings();
    await config.save();
    new Notice(i18n.settings.dailyNoteTask.templateManager.notice.cleared);
    this.onApplied();
    this.close();
  }
}
