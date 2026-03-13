import * as vscode from "vscode";
import * as path from "path";

export class DailyNotePathResolver {
  constructor(private readonly baseDir: string) {}

  resolve(date: string): vscode.Uri {
    const workspace = vscode.workspace.workspaceFolders?.[0];
    if (!workspace) {
      throw new Error("Workspace is not opened.");
    }

    const journalDir = path.join(workspace.uri.fsPath, this.baseDir);
    const filePath = path.join(journalDir, `${date}.md`);

    return vscode.Uri.file(filePath);
  }
}
