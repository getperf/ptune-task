import { App } from "obsidian";
import { DailyReviewFlowProgressEvent } from "../../application/review_flow/types/DailyReviewFlowProgressEvent";
import { ReviewProgressModal } from "./ReviewProgressModal";

type TerminalState = { type: "completed" } | { type: "failed"; message: string } | null;

export class ReviewProgressController {
  private readonly events: DailyReviewFlowProgressEvent[] = [];
  private readonly statusLines: string[] = [];
  private currentModal: ReviewProgressModal | null = null;
  private terminalState: TerminalState = null;
  private cancelAction: (() => Promise<void>) | null = null;

  constructor(private readonly app: App, private readonly date: string) {}
  open(): void { this.currentModal = this.openModal(); }
  handleEvent(event: DailyReviewFlowProgressEvent): void { this.events.push(event); if (event.type === "failed") this.terminalState = { type: "failed", message: event.message }; this.currentModal?.handleEvent(event); }
  markCompleted(): void { this.terminalState = { type: "completed" }; this.currentModal?.markCompleted(); }
  markFailed(message: string): void { this.terminalState = { type: "failed", message }; this.currentModal?.markFailed(message); }
  setCancelAction(action: () => Promise<void>): void { this.cancelAction = action; }
  appendStatusLine(line: string): void { this.statusLines.push(line); this.currentModal?.appendStatusLine(line); }

  private openModal(): ReviewProgressModal {
    const modal = new ReviewProgressModal(this.app, () => modal.close(), async () => { if (this.cancelAction) await this.cancelAction(); });
    modal.setCloseCallback(() => { this.currentModal = null; });
    modal.open();
    for (const event of this.events) modal.handleEvent(event);
    for (const line of this.statusLines) modal.appendStatusLine(line);
    if (this.terminalState?.type === "completed") modal.markCompleted();
    if (this.terminalState?.type === "failed") modal.markFailed(this.terminalState.message);
    return modal;
  }
}
