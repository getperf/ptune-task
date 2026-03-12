import { App, Modal } from "obsidian";
import { ConfirmPort } from "../../application/sync/push/PushSyncUseCase";

type ConfirmSummary = Parameters<ConfirmPort["confirm"]>[0];

export class ObsidianConfirmDialog implements ConfirmPort {
  constructor(private readonly app: App) {}

  confirm(summary: ConfirmSummary): Promise<boolean> {
    return new Promise((resolve) => {
      new ConfirmModal(this.app, summary, resolve).open();
    });
  }
}

class ConfirmModal extends Modal {
  private resolved = false;

  constructor(
    app: App,
    private readonly summary: ConfirmSummary,
    private readonly resolve: (result: boolean) => void,
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;

    contentEl.createEl("p", { text: `Create: ${this.summary.create}` });
    contentEl.createEl("p", { text: `Update: ${this.summary.update}` });
    contentEl.createEl("p", { text: `Delete: ${this.summary.delete}` });

    const btnDiv = contentEl.createDiv({ cls: "modal-button-container" });

    btnDiv.createEl("button", { text: "Yes" }).addEventListener("click", () => {
      this.done(true);
    });

    btnDiv.createEl("button", { text: "No" }).addEventListener("click", () => {
      this.done(false);
    });
  }

  onClose(): void {
    this.done(false);
    this.contentEl.empty();
  }

  private done(result: boolean): void {
    if (this.resolved) return;
    this.resolved = true;
    this.resolve(result);
    this.close();
  }
}
