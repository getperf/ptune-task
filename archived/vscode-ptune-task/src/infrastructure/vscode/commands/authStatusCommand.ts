// src/infrastructure/vscode/commands/authStatusCommand.ts

import * as vscode from "vscode";
import { PtuneSyncAuthService } from "../../sync/ptune-sync/PtuneSyncAuthService";

export function registerAuthStatusCommand(
  context: vscode.ExtensionContext,
  authService: PtuneSyncAuthService,
) {
  const disposable = vscode.commands.registerCommand(
    "ptune-task.authStatus",
    async () => {
      try {
        const result = await authService.status();

        vscode.window.showInformationMessage(
          `Authenticated: ${result.email}`,
        );
      } catch {
        vscode.window.showWarningMessage(
          "Not authenticated. Please login.",
        );
      }
    },
  );

  context.subscriptions.push(disposable);
}