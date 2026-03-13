// src/infrastructure/vscode/commands/authLoginCommand.ts

import * as vscode from "vscode";
import { PtuneSyncAuthService } from "../../sync/ptune-sync/PtuneSyncAuthService";

export function registerAuthLoginCommand(
  context: vscode.ExtensionContext,
  authService: PtuneSyncAuthService,
) {
  const disposable = vscode.commands.registerCommand(
    "ptune-task.login",
    async () => {
      try {
        await authService.login();
        vscode.window.showInformationMessage("Google login successful.");
      } catch (e: any) {
        vscode.window.showErrorMessage(`Login failed: ${e.message}`);
      }
    },
  );

  context.subscriptions.push(disposable);
}
