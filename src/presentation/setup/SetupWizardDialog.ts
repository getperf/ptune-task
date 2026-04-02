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

    const headerEl = contentEl.createDiv({ cls: "ptune-setup-header" });
    headerEl.createEl("h2", { text: t.title, cls: "ptune-setup-title" });
    const refreshButton = headerEl.createEl("button", { text: t.refresh });
    refreshButton.addClass("mod-cta");
    refreshButton.onClickEvent(() => {
      void this.render();
    });

    const checklist = await this.checklistService.getChecklist();
    const noteResources = checklist.required.find((item) => item.id === "note_resources");

    this.renderSection(
      contentEl,
      t.requiredSection,
      checklist.required.filter((item) => item.id !== "note_resources"),
      noteResources,
    );
    this.renderSection(contentEl, t.recommendedSection, checklist.recommended);
  }

  private renderNoteResources(container: HTMLElement, item: SetupItem): void {
    const t = i18n.common.setup.noteResources;

    const headerEl = container.createDiv({ cls: "ptune-setup-note-resources-header" });
    headerEl.createEl("h3", { text: t.title, cls: "ptune-setup-section-title" });
    const runButton = headerEl.createEl("button", { text: t.run });
    runButton.addClass("mod-cta");
    runButton.onClickEvent(() => {
      void this.runNoteSetup();
    });

    container.createEl("div", {
      text: `${this.resolveStatusLabel(item.status)}: ${item.message}`,
      cls: "setting-item-description",
    });
  }

  private renderSection(
    container: HTMLElement,
    title: string,
    items: SetupItem[],
    noteResources?: SetupItem,
  ): void {
    container.createEl("h3", { text: title, cls: "ptune-setup-section-title" });
    this.renderSectionHelp(container, title);

    if (title === i18n.common.setup.requiredSection && noteResources) {
      this.renderNoteResources(container, noteResources);
    }

    for (const item of items) {
      const setting = new Setting(container)
        .setName(item.title);

      setting.setDesc(this.buildItemDescription(item));

      if (item.level === "recommended" && item.actionUrl) {
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

  private renderSectionHelp(container: HTMLElement, title: string): void {
    const t = i18n.common.setup;

    if (title === t.requiredSection) {
      container.createEl("div", {
        text: t.requiredSectionDesc,
        cls: "setting-item-description",
      });
      return;
    }

    if (title === t.recommendedSection) {
      const descEl = container.createEl("div", {
        cls: "setting-item-description",
      });
      descEl.appendText(`${t.recommendedSectionDesc} `);
      const linkEl = descEl.createEl("a", {
        text: `${t.manualLinkLabel}: ${t.recommendedSectionGuideUrl}`,
        href: t.recommendedSectionGuideUrl,
      });
      linkEl.target = "_blank";
      linkEl.rel = "noopener noreferrer";
    }
  }

  private buildItemDescription(item: SetupItem): DocumentFragment {
    const t = i18n.common.setup;
    const fragment = document.createDocumentFragment();
    fragment.appendText(`${this.resolveStatusLabel(item.status)}: ${item.message}`);

    if (item.level === "required" && item.actionUrl) {
      fragment.appendChild(document.createElement("br"));
      const linkEl = document.createElement("a");
      linkEl.textContent = `${t.manualLinkLabel}: ${item.actionUrl}`;
      linkEl.href = item.actionUrl;
      linkEl.target = "_blank";
      linkEl.rel = "noopener noreferrer";
      fragment.appendChild(linkEl);
      linkEl.addEventListener("click", (event) => {
        event.preventDefault();
        window.open(item.actionUrl, "_blank");
      });
    }

    return fragment;
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
