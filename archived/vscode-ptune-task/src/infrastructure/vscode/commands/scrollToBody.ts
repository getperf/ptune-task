import * as vscode from "vscode";

export function scrollToBody(editor: vscode.TextEditor) {
  const doc = editor.document;
  const text = doc.getText();

  // frontmatter 検出
  if (!text.startsWith("---")) {
    return;
  }

  const lines = text.split("\n");

  // 2つ目の --- を探す
  let endLine = 0;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      endLine = i + 1;
      break;
    }
  }

  const position = new vscode.Position(endLine, 0);
  const range = new vscode.Range(position, position);

  editor.revealRange(range, vscode.TextEditorRevealType.AtTop);
  editor.selection = new vscode.Selection(position, position);
}