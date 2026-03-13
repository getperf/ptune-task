import * as vscode from "vscode";
import { PullTodayCommand } from "../../../presentation/pull/PullTodayCommand";

export function registerPullCommand(
  context: vscode.ExtensionContext,
  command: PullTodayCommand,
) {
  const disposable = vscode.commands.registerCommand("ptune-task.pull", () =>
    command.execute(),
  );

  context.subscriptions.push(disposable);
}
