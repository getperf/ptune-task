import { App, Modal, Setting } from "obsidian";
import { i18n } from "../../shared/i18n/I18n";

export class DailyNotesReviewModal extends Modal {
  private date: string;

  constructor(
    app: App,
    initialDate: string,
    private readonly onSubmit: (date: string) => Promise<void>,
  ) {
    super(app);
    this.date = initialDate;
  }

  onOpen(): void {
    const t = i18n.common.dailyNotesReview;
    const { contentEl } = this;

    contentEl.createEl("h2", { text: t.modal.title });

    new Setting(contentEl)
      .setName(t.modal.dateLabel)
      .addText((text) => {
        text.setValue(this.date).onChange((value) => {
          this.date = value.trim();
        });
      });

    new Setting(contentEl).addButton((button) =>
      button
        .setButtonText(t.modal.run)
        .setCta()
        .onClick(() => {
          void this.submit();
        }),
    );
  }

  onClose(): void {
    this.contentEl.empty();
  }

  private async submit(): Promise<void> {
    await this.onSubmit(this.date);
    this.close();
  }
}
