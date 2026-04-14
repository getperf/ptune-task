import { App, Modal, Setting } from "obsidian";
import { i18n } from "../../shared/i18n/I18n";

export class AuthLoginProgressModal extends Modal {
  private static readonly CARD_BORDER = "1px solid var(--background-modifier-border)";
  private statusEl?: HTMLElement;
  private opened = false;
  private autoCloseTimer: number | null = null;
  private readonly onCancel: () => void;

  constructor(app: App, onCancel: () => void) {
    super(app);
    this.onCancel = onCancel;
  }

  get isOpened(): boolean {
    return this.opened;
  }

  onOpen(): void {
    this.opened = true;
    const t = i18n.common.auth.progress;
    const { contentEl } = this;

    contentEl.empty();
    contentEl.addClass("ptune-auth-login-progress");

    const headerEl = contentEl.createDiv();
    headerEl.setCssProps({
      display: "flex",
      flexDirection: "column",
      gap: "4px",
      marginBottom: "16px",
    });

    headerEl.createEl("h2", { text: t.title });
    headerEl.createEl("p", { text: t.subtitle });

    const statusCardEl = this.createCard(contentEl);
    statusCardEl.setCssProps({
      marginBottom: "12px",
      backgroundColor: "var(--background-secondary-alt)",
    });
    statusCardEl.createEl("div", { text: t.statusLabel }).setCssProps({ fontWeight: "600" });
    this.statusEl = statusCardEl.createEl("p", { text: t.running });
    this.statusEl.setCssProps({ margin: "6px 0 0 0" });

    const instructionCardEl = this.createCard(contentEl);
    instructionCardEl.setCssProps({ marginBottom: "12px" });
    instructionCardEl.createEl("div", { text: t.instructionTitle }).setCssProps({ fontWeight: "600" });
    instructionCardEl.createEl("p", { text: t.browserInstruction }).setCssProps({ marginBottom: "8px" });
    instructionCardEl.createEl("p", { text: t.autoClose }).setCssProps({ margin: "0" });

    const hintCardEl = this.createCard(contentEl);
    hintCardEl.setCssProps({
      marginBottom: "16px",
      backgroundColor: "var(--background-secondary)",
    });
    hintCardEl.createEl("div", { text: t.hintTitle }).setCssProps({ fontWeight: "600" });
    hintCardEl.createEl("p", { text: t.backButtonHint }).setCssProps({ margin: "6px 0 0 0" });

    new Setting(contentEl)
      .addButton((button) => {
        button
          .setButtonText(i18n.common.action.cancel)
          .onClick(() => this.onCancel());
      });
  }

  onClose(): void {
    this.opened = false;
    if (this.autoCloseTimer !== null) {
      window.clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = null;
    }
    this.contentEl.empty();
  }

  markCompleted(): void {
    if (!this.isOpened) {
      this.open();
    }

    const t = i18n.common.auth.progress;
    if (this.statusEl) {
      this.statusEl.setText(t.completed);
    }

    this.autoCloseTimer = window.setTimeout(() => this.close(), 3000);
  }

  markFailed(message: string): void {
    if (!this.isOpened) {
      this.open();
    }

    const t = i18n.common.auth.progress;
    if (this.statusEl) {
      this.statusEl.setText(`${t.failed}: ${message}`);
    }
  }

  markTimedOut(): void {
    if (!this.isOpened) {
      this.open();
    }

    const t = i18n.common.auth.progress;
    if (this.statusEl) {
      this.statusEl.setText(t.timedOut);
    }
  }

  private createCard(parent: HTMLElement): HTMLDivElement {
    const cardEl = parent.createDiv();
    cardEl.setCssProps({
      border: AuthLoginProgressModal.CARD_BORDER,
      borderRadius: "10px",
      padding: "12px 14px",
    });
    return cardEl;
  }
}
