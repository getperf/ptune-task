import * as vscode from "vscode";
import { PushAndRebuildCommand } from "../../../presentation/push/PushAndRebuildCommand";

export function registerSyncCommand(
  context: vscode.ExtensionContext,
  command: PushAndRebuildCommand,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("ptune-task.sync", async () => {
      await command.execute();
    }),
  );
}
