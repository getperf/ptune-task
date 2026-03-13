import * as vscode from "vscode";
import { ReviewCommand } from "../../../presentation/review/ReviewCommand";

export function registerReviewCommand(
  context: vscode.ExtensionContext,
  command: ReviewCommand,
) {
  const disposable = vscode.commands.registerCommand("ptune-task.review", () =>
    command.execute(),
  );

  context.subscriptions.push(disposable);
}
