import * as vscode from "vscode";
import { isTaskLine } from "./TaskLineDetector";
import { Logger } from "../../../shared/logger/Logger";

const CLEANUP_COMMAND = "ptune-task.cleanupTrigger";

export class TaskCompletionProvider implements vscode.CompletionItemProvider {
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.ProviderResult<vscode.CompletionItem[]> {
    const logger = Logger.get();

    const lineText = document.lineAt(position.line).text;
    const prefix = lineText.substring(0, position.character);
    logger.debug("lineText=", lineText);

    if (!isTaskLine(lineText)) return;

    if (prefix.endsWith("##")) {
      return this.createTagItems();
    }

    if (prefix.endsWith("||")) {
      return this.createGoalItems();
    }

    if (prefix.endsWith("::")) {
      return this.createPomodoroItems();
    }

    return;
  }

  private attachCleanup(item: vscode.CompletionItem) {
    item.command = {
      command: CLEANUP_COMMAND,
      title: "Cleanup Trigger",
    };
  }

  private createTagItems(): vscode.CompletionItem[] {
    const config = vscode.workspace.getConfiguration("ptune-task");
    const tags: string[] = config.get("tagSuggestions") ?? [];

    return tags.slice(0, 10).map((tag) => {
      const item = new vscode.CompletionItem(
        tag,
        vscode.CompletionItemKind.Text,
      );
      item.insertText = ` #${tag}`;
      this.attachCleanup(item);
      return item;
    });
  }

  private createGoalItems(): vscode.CompletionItem[] {
    const config = vscode.workspace.getConfiguration("ptune-task");
    const goals: string[] = config.get("goalSuggestions") ?? [];

    return goals.slice(0, 10).map((goal) => {
      const item = new vscode.CompletionItem(
        goal,
        vscode.CompletionItemKind.Text,
      );
      item.insertText = ` | ${goal}`;
      this.attachCleanup(item);
      return item;
    });
  }

  private createPomodoroItems(): vscode.CompletionItem[] {
    return Array.from({ length: 8 }, (_, i) => i + 1).map((n) => {
      const item = new vscode.CompletionItem(
        `🍅x${n}`,
        vscode.CompletionItemKind.Text,
      );
      item.insertText = ` 🍅x${n}`;
      this.attachCleanup(item);
      return item;
    });
  }
}
