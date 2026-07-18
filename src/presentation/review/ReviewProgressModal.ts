import { App, Modal, Setting } from "obsidian";
import { DailyReviewFlowProgressEvent } from "../../application/review_flow/types/DailyReviewFlowProgressEvent";
import { i18n } from "../../shared/i18n/I18n";

export class ReviewProgressModal extends Modal {
  private statusEl?: HTMLElement;
  private logEl?: HTMLElement;
  private readonly lines: string[] = [];
  private autoCloseTimer: number | null = null;

  constructor(app: App, private readonly onContinueInBackground: () => void, private readonly onCancel: () => Promise<void>) { super(app); }

  onOpen(): void {
    const t = i18n.common.reviewFlow.progress;
    const { contentEl } = this;
    contentEl.createEl("h2", { text: t.title });
    this.statusEl = contentEl.createEl("p", { text: t.running });
    const logContainer = contentEl.createDiv();
    logContainer.setCssProps({ border: "1px solid var(--background-modifier-border)", borderRadius: "8px", backgroundColor: "var(--background-secondary)", padding: "10px 12px", minHeight: "120px", maxHeight: "160px", overflowY: "auto" });
    this.logEl = logContainer.createEl("pre");
    this.logEl.setCssProps({ margin: "0", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: "1.5" });
    new Setting(contentEl).addButton((button) => button.setButtonText("バックグラウンドで続行").onClick(() => this.onContinueInBackground())).addButton((button) => button.setButtonText("日次振り返りを中止").setWarning().onClick(() => void this.onCancel()));
  }

  onClose(): void { if (this.autoCloseTimer !== null) window.clearTimeout(this.autoCloseTimer); this.autoCloseTimer = null; this.contentEl.empty(); }
  handleEvent(event: DailyReviewFlowProgressEvent): void { const t = i18n.common.reviewFlow.progress; if (event.type === "started") this.appendLine(`${t.events.started}: ${event.date}`); else if (event.type === "task_review_started") this.appendLine(`${t.events.taskReviewStarted}: ${event.date}`); else if (event.type === "task_review_completed") this.appendLine(`${t.events.taskReviewCompleted}: ${event.taskCount}`); else if (event.type === "daily_notes_review_started") this.appendLine(`${t.events.notesReviewStarted}: ${event.date} (${event.targetCount})`); else if (event.type === "daily_notes_review_completed") this.appendLine(`${t.events.notesReviewCompleted}: ${event.noteCount}`); else if (event.type === "failed") this.markFailed(event.message); }
  markCompleted(): void { if (this.statusEl) this.statusEl.setText(i18n.common.reviewFlow.progress.completed); this.autoCloseTimer = window.setTimeout(() => this.close(), 3000); }
  markFailed(message: string): void { if (this.statusEl) this.statusEl.setText(`${i18n.common.reviewFlow.progress.failed}: ${message}`); this.appendLine(`${i18n.common.reviewFlow.progress.failed}: ${message}`); }
  appendStatusLine(line: string): void { this.appendLine(line); }
  private appendLine(line: string): void { this.lines.push(line); this.logEl?.setText(this.lines.join("\n")); }
}
