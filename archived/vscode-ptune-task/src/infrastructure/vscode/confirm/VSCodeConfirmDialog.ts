import * as vscode from "vscode";
import { ConfirmPort } from "../../../application/sync/push/PushSyncUseCase";

export class VSCodeConfirmDialog implements ConfirmPort {
  async confirm(summary: {
    create: number;
    update: number;
    delete: number;
    errors: number;
    warnings: number;
  }): Promise<boolean> {
    const message =
      `Create: ${summary.create}\n` +
      `Update: ${summary.update}\n` +
      `Delete: ${summary.delete}\n\n` +
      `Apply changes?`;

    const result = await vscode.window.showInformationMessage(
      message,
      { modal: true },
      "Yes",
      "No",
    );

    return result === "Yes";
  }
}
