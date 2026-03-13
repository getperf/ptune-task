import * as vscode from "vscode";
import { isTaskLine } from "./TaskLineDetector";

export class SubTaskTemplateCompletionProvider
  implements vscode.CompletionItemProvider
{
  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): vscode.ProviderResult<vscode.CompletionItem[]> {
    const lineText = document.lineAt(position.line).text;

    if (!isTaskLine(lineText)) return;

    // - [ ] の行のみ対象
    const match = lineText.match(/^\s*-\s\[( |x)\]\s+/);
    if (!match) return;

    const config = vscode.workspace.getConfiguration("ptune-task");
    const templates: string[] = config.get("subTaskTemplates") ?? [];
    if (!templates.length) return;

    const taskStartIndex = match[0].length;
    const prefix = lineText.substring(0, position.character);
    const typed = prefix.substring(taskStartIndex).trim();

    const matched =
      typed.length === 0
        ? templates
        : templates.filter((t) => t.startsWith(typed));

    if (!matched.length) return;

    return matched.map((template, index) => {
      const item = new vscode.CompletionItem(
        template,
        vscode.CompletionItemKind.Text,
      );

      item.range = new vscode.Range(
        new vscode.Position(position.line, taskStartIndex),
        position,
      );

      item.insertText = template;

      // 既存補完よりは弱めの優先度
      item.sortText = `1000_${index}`;
      item.preselect = index === 0;

      return item;
    });
  }
}
