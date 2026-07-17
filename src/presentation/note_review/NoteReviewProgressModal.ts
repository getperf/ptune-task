import { App, Modal, Setting } from "obsidian";
import { i18n } from "../../shared/i18n/I18n";

/**
 * ノート要約の依頼を受理してから ptune-log の終端通知が届くまでの確認モーダル。
 * open で「生成中…」を表示し、終端到達時に showOutcome で結果へ差し替える。
 * 成功/スキップは自動クローズ、失敗/タイムアウトはログ参照文言と OK ボタンを出して
 * ユーザーが明示的に閉じるまで残す（見落とし防止）。
 */
export class NoteReviewProgressModal extends Modal {
  private static readonly AUTO_CLOSE_MS = 3000;

  private statusEl?: HTMLElement;
  private autoCloseTimer: number | null = null;

  constructor(app: App) {
    super(app);
  }

  onOpen(): void {
    const t = i18n.common.noteReview.progress;
    const { contentEl } = this;

    contentEl.createEl("h2", { text: t.title });
    this.statusEl = contentEl.createEl("p", { text: t.processing });
  }

  onClose(): void {
    if (this.autoCloseTimer !== null) {
      window.clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = null;
    }
    this.contentEl.empty();
  }

  showOutcome(message: string, isError: boolean): void {
    if (this.statusEl) {
      this.statusEl.setText(message);
    }

    if (!isError) {
      this.autoCloseTimer = window.setTimeout(
        () => this.close(),
        NoteReviewProgressModal.AUTO_CLOSE_MS,
      );
      return;
    }

    // Errors stay open with a log pointer and an explicit OK so the user
    // actually reads the failure instead of it flashing by.
    const t = i18n.common.noteReview.progress;
    this.contentEl.createEl("p", { text: t.seeLog });
    new Setting(this.contentEl).addButton((button) =>
      button
        .setButtonText(i18n.common.action.close)
        .setCta()
        .onClick(() => this.close()),
    );
  }
}
