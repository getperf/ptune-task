import { App, Modal, Setting } from "obsidian";
import { i18n } from "../../shared/i18n/I18n";
import type { EditableNoteSummary } from "../../application/note_review/models/EditableNoteSummary";

type NoteSummaryModalOptions = {
  description?: string;
  canRegenerate?: boolean;
};

export class NoteSummaryModal extends Modal {
  private value: EditableNoteSummary;
  private summaryTextAreaEl: HTMLTextAreaElement | null = null;
  private summarySegmentsTextAreaEl: HTMLTextAreaElement | null = null;
  private readonly options: NoteSummaryModalOptions;

  constructor(
    app: App,
    initialValue: EditableNoteSummary,
    private readonly onSave: (value: EditableNoteSummary) => Promise<void>,
    private readonly onRegenerate: () => Promise<EditableNoteSummary>,
    options?: NoteSummaryModalOptions,
  ) {
    super(app);
    this.value = initialValue;
    this.options = options ?? {};
  }

  onOpen(): void {
    const t = i18n.common.noteReview;
    const { contentEl } = this;

    this.modalEl.addClass("ptune-note-summary-modal");
    contentEl.createEl("h2", { text: t.modal.title });

    if (this.options.description) {
      contentEl.createEl("p", {
        text: this.options.description,
        cls: "ptune-note-summary-description",
      });
    }

    const fieldEl = contentEl.createDiv({ cls: "ptune-note-summary-field" });
    fieldEl.createEl("label", {
      text: t.modal.summaryLabel,
      cls: "ptune-note-summary-label",
    });

    this.summaryTextAreaEl = fieldEl.createEl("textarea", {
      cls: "ptune-note-summary-textarea",
    });
    this.summaryTextAreaEl.value = this.value.summary;
    this.summaryTextAreaEl.addEventListener("input", () => {
      this.value.summary = this.summaryTextAreaEl?.value ?? "";
    });

    fieldEl.createEl("label", {
      text: t.modal.summarySegmentsLabel,
      cls: "ptune-note-summary-label",
    });
    this.summarySegmentsTextAreaEl = fieldEl.createEl("textarea", {
      cls: "ptune-note-summary-textarea",
    });
    this.summarySegmentsTextAreaEl.value = this.value.summarySegmentsMarkdown;
    this.summarySegmentsTextAreaEl.addEventListener("input", () => {
      this.value.summarySegmentsMarkdown = this.summarySegmentsTextAreaEl?.value ?? "";
    });

    const actionSetting = new Setting(contentEl)
      .setClass("ptune-note-summary-actions");

    if (this.options.canRegenerate ?? true) {
      actionSetting.addButton((button) =>
        button
          .setButtonText(t.modal.regenerate)
          .onClick(() => {
            void this.regenerate();
          }),
      );
    }

    actionSetting.addButton((button) =>
        button
          .setButtonText(t.modal.save)
          .setCta()
          .onClick(() => {
            void this.save();
          }),
      );
  }

  onClose(): void {
    this.modalEl.removeClass("ptune-note-summary-modal");
    this.summaryTextAreaEl = null;
    this.summarySegmentsTextAreaEl = null;
    this.contentEl.empty();
  }

  private async regenerate(): Promise<void> {
    this.value = await this.onRegenerate();
    if (this.summaryTextAreaEl) {
      this.summaryTextAreaEl.value = this.value.summary;
    }
    if (this.summarySegmentsTextAreaEl) {
      this.summarySegmentsTextAreaEl.value = this.value.summarySegmentsMarkdown;
    }
  }

  private async save(): Promise<void> {
    await this.onSave(this.value);
    this.close();
  }
}
