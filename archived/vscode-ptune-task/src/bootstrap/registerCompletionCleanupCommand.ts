import * as vscode from "vscode";
import { Logger } from "../shared/logger/Logger";

export function registerCompletionCleanupCommand(
  context: vscode.ExtensionContext,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("ptune-task.cleanupTrigger", async () => {
      const logger = Logger.get();
      const editor = vscode.window.activeTextEditor;
      if (!editor) return;

      const position = editor.selection.active;
      const lineNumber = position.line;
      const document = editor.document;
      const original = document.lineAt(lineNumber).text;

      // ① インデント保持
      const indentMatch = original.match(/^\s*/);
      const indent = indentMatch ? indentMatch[0] : "";

      // ② 本文のみ処理
      const content = original.slice(indent.length);

      const cleanedContent = content
        .replace(/::/g, "")
        .replace(/##/g, "")
        .replace(/\|\|/g, "")
        .trimEnd();

      const cleaned = indent + cleanedContent;

      if (cleaned === original) return;

      await editor.edit((editBuilder) => {
        editBuilder.replace(
          document.lineAt(lineNumber).range,
          cleaned,
        );
      });

      logger.debug("[completion] cleanup executed");
    }),
  );
}