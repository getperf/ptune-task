import * as vscode from "vscode";
import { TaskCompletionProvider } from "../infrastructure/vscode/completion/TaskCompletionProvider";
import { registerCompletionCleanupCommand } from "./registerCompletionCleanupCommand";
import { SubTaskTemplateCompletionProvider } from "../infrastructure/vscode/completion/SubTaskTemplateCompletionProvider";

export function registerTaskCompletion(context: vscode.ExtensionContext): void {
  const mainProvider = new TaskCompletionProvider();
  const subTaskProvider = new SubTaskTemplateCompletionProvider();

  // 記号トリガー専用
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      { language: "markdown" },
      mainProvider,
      "#",
      "|",
      ":",
    ),
  );

  // Ctrl+Space 専用（トリガーなし）
  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      { language: "markdown" },
      subTaskProvider,
    ),
  );

  registerCompletionCleanupCommand(context);
}
