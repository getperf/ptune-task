import { App } from "obsidian";
import { AuthLoginProgressModal } from "./AuthLoginProgressModal";
import { i18n } from "../../shared/i18n/I18n";

export class AuthLoginProgressService {
  private static readonly REOPEN_INTERVAL_MS = 1000;
  private static readonly TIMEOUT_MS = 90000;

  constructor(private readonly app: App) {}

  async run<T>(action: () => Promise<T>): Promise<T> {
    let active = true;
    let cancelWait: (() => void) | null = null;

    const modal = new AuthLoginProgressModal(this.app, () => {
      active = false;
      modal.close();
      cancelWait?.();
    });
    modal.open();

    const reopenTimer = window.setInterval(() => {
      if (active && !modal.isOpened) {
        modal.open();
      }
    }, AuthLoginProgressService.REOPEN_INTERVAL_MS);

    const actionPromise = action()
      .then((result) => ({ type: "result" as const, result }))
      .catch((error: unknown) => ({ type: "error" as const, error }));

    const timeoutPromise = new Promise<{ type: "timeout" }>((resolve) => {
      window.setTimeout(() => resolve({ type: "timeout" }), AuthLoginProgressService.TIMEOUT_MS);
    });
    const cancelledPromise = new Promise<{ type: "cancelled" }>((resolve) => {
      cancelWait = () => resolve({ type: "cancelled" });
    });

    try {
      const outcome = await Promise.race([actionPromise, timeoutPromise, cancelledPromise]);
      window.clearInterval(reopenTimer);

      if (outcome.type === "cancelled") {
        throw new Error(i18n.common.auth.notice.loginCancelled);
      }

      if (outcome.type === "timeout") {
        active = false;
        modal.markTimedOut();
        throw new Error(i18n.common.auth.notice.loginTimedOut);
      }

      if (outcome.type === "error") {
        const message = outcome.error instanceof Error ? outcome.error.message : String(outcome.error);
        modal.markFailed(message);
        throw outcome.error;
      }

      active = false;
      modal.markCompleted();
      return outcome.result;
    } finally {
      window.clearInterval(reopenTimer);
    }
  }
}
