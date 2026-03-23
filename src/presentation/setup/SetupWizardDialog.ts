import { App, Modal, Notice, Setting } from "obsidian";
import { SetupChecklistService } from "../../application/setup/services/SetupChecklistService";
import { SetupItem } from "../../application/setup/types/SetupChecklist";
import { NoteSetupHelper } from "../../infrastructure/setup/NoteSetupHelper";
import { i18n } from "../../shared/i18n/I18n";
import { logger } from "../../shared/logger/loggerInstance";

export class SetupWizardDialog extends Modal {
  constructor(
    app: App,
    private readonly checklistService: SetupChecklistService,
    private readonly noteSetupHelper: NoteSetupHelper,
  ) {
    super(app);
  }

  onOpen(): void {
    this.modalEl.addClass("ptune-setup-modal");
    void this.render();
  }

  onClose(): void {
    this.modalEl.removeClass("ptune-setup-modal");
    this.contentEl.empty();
  }

  private async render(): Promise<void> {
    const t = i18n.common.setup;
    const { contentEl } = this;
    contentEl.empty();

    contentEl.createEl("h2", { text: t.title, cls: "ptune-setup-title" });

    new Setting(contentEl)
      .setName(t.refresh)
      .setDesc(t.refreshDesc)
      .addButton((button) =>
        button.setButtonText(t.refresh).onClick(() => {
          void this.render();
        }),
      );

    const checklist = await this.checklistService.getChecklist();
    const noteResources = checklist.required.find((item) => item.id === "note_resources");

    if (noteResources) {
      this.renderNoteResources(contentEl, noteResources);
    }

    this.renderSection(
      contentEl,
      t.requiredSection,
      checklist.required.filter((item) => item.id !== "note_resources"),
    );
    this.renderSection(contentEl, t.recommendedSection, checklist.recommended);
  }

  private renderNoteResources(container: HTMLElement, item: SetupItem): void {
    const t = i18n.common.setup.noteResources;

    container.createEl("h3", { text: t.title, cls: "ptune-setup-section-title" });

    new Setting(container)
      .setName(t.statusTitle)
      .setDesc(`${this.resolveStatusLabel(item.status)}: ${item.message}`);

    new Setting(container)
      .setName(t.run)
      .setDesc(t.desc)
      .addButton((button) =>
        button.setButtonText(t.run).onClick(() => {
          void this.runNoteSetup();
        }),
      );
  }

  private renderSection(
    container: HTMLElement,
    title: string,
    items: SetupItem[],
  ): void {
    container.createEl("h3", { text: title, cls: "ptune-setup-section-title" });

    for (const item of items) {
      const setting = new Setting(container)
        .setName(item.title)
        .setDesc(`${this.resolveStatusLabel(item.status)}: ${item.message}`);

      if (item.actionUrl) {
        setting.addExtraButton((button) => {
          button
            .setIcon("link")
            .setTooltip(i18n.common.setup.openGuide)
            .onClick(() => {
              window.open(item.actionUrl, "_blank");
            });
        });
      }
    }
  }

  private resolveStatusLabel(status: SetupItem["status"]): string {
    const t = i18n.common.setup.status;
    switch (status) {
      case "ok":
        return t.ok;
      case "missing":
        return t.missing;
      case "warning":
        return t.warning;
      case "skipped":
        return t.skipped;
    }
  }

  private async runNoteSetup(): Promise<void> {
    try {
      const result = await this.noteSetupHelper.ensureResources();
      logger.info(
        `[Command] SetupWizardDialog.noteSetup created=${result.createdPaths.length} updated=${result.updatedTemplates.length}`,
      );
      new Notice(i18n.common.setup.noteResources.completed);
      await this.render();
    } catch (error) {
      logger.warn("[Command] SetupWizardDialog.noteSetup failed", error);
      const message = error instanceof Error ? error.message : String(error);
      new Notice(`${i18n.common.notice.failed}: ${message}`);
    }
  }
}
