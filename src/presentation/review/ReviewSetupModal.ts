import { App, Modal, Setting } from "obsidian";
import { ReviewFlowDialogOptions } from "../../application/review_flow/types/ReviewFlowDialogOptions";
import { ReviewFlowRunOptions } from "../../application/review_flow/types/ReviewFlowRunOptions";
import { i18n } from "../../shared/i18n/I18n";

export class ReviewSetupModal extends Modal {
  private readonly state: ReviewFlowRunOptions;
  private errorEl?: HTMLElement;
  private readonly blockBackdropClick = (event: MouseEvent): void => {
    if (event.target !== this.containerEl) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  };

  constructor(
    app: App,
    private readonly options: ReviewFlowDialogOptions,
    private readonly onSubmit: (options: ReviewFlowRunOptions) => Promise<void>,
  ) {
    super(app);
    this.state = {
      date: options.date,
      taskReviewEnabled: options.taskReviewEnabled,
      // Daily notes review requires the ptune-log event hook. Force it off when
      // the hook is unavailable so it can never be submitted enabled.
      dailyNotesReviewEnabled:
        options.notesReviewAvailable && options.dailyNotesReviewEnabled,
    };
  }

  onOpen(): void {
    const t = i18n.common.reviewFlow.setup;
    const { contentEl } = this;

    this.containerEl.addEventListener("click", this.blockBackdropClick, true);
    contentEl.createEl("h2", { text: t.title });
    this.errorEl = contentEl.createEl("p");

    new Setting(contentEl)
      .setName(t.dateLabel)
      .addDropdown((dropdown) => {
        const items = this.options.dateCandidates.reduce<Record<string, string>>((acc, value) => {
          acc[value] = value;
          return acc;
        }, {});

        dropdown
          .addOptions(items)
          .setValue(this.state.date)
          .onChange((value) => {
            this.state.date = value;
          });
      });

    new Setting(contentEl)
      .setName(t.taskReviewLabel)
      .addToggle((toggle) =>
        toggle
          .setValue(this.state.taskReviewEnabled)
          .onChange((value) => {
            this.state.taskReviewEnabled = value;
          }),
      );

    const notesReviewSetting = new Setting(contentEl)
      .setName(t.notesReviewLabel)
      .addToggle((toggle) =>
        toggle
          .setDisabled(!this.options.notesReviewAvailable)
          .setValue(this.state.dailyNotesReviewEnabled)
          .onChange((value) => {
            this.state.dailyNotesReviewEnabled = value;
          }),
      );
    if (!this.options.notesReviewAvailable) {
      notesReviewSetting.setDesc(t.notesReviewRequiresEventHook);
    }

    new Setting(contentEl)
      .addButton((button) =>
        button
          .setButtonText(t.run)
          .setCta()
          .onClick(() => {
            void this.submit();
          }),
      )
      .addButton((button) =>
        button
          .setButtonText(i18n.common.action.cancel)
          .onClick(() => {
            this.close();
          }),
      );
  }

  onClose(): void {
    this.containerEl.removeEventListener("click", this.blockBackdropClick, true);
    this.contentEl.empty();
  }

  onEscape(): void {
    // Keep the setup modal open until the user explicitly submits or cancels.
  }

  private async submit(): Promise<void> {
    const t = i18n.common.reviewFlow.setup;

    if (!this.state.taskReviewEnabled && !this.state.dailyNotesReviewEnabled) {
      if (this.errorEl) {
        this.errorEl.setText(t.atLeastOneRequired);
      }
      return;
    }

    this.close();
    await this.onSubmit({ ...this.state });
  }
}
