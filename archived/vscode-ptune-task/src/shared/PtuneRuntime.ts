import * as vscode from "vscode";
import { VSCodeConfigService } from "../infrastructure/vscode/VSCodeConfigService";

export class PtuneRuntime {
  private readonly configService = new VSCodeConfigService();

  getBaseDir(): string {
    const config = vscode.workspace.getConfiguration("ptuneTask");
    return config.get<string>("baseDir") || "_journal";
  }

  getWorkspaceRoot(): vscode.Uri {
    const folder = vscode.workspace.workspaceFolders?.[0];
    if (!folder) {
      throw new Error("Workspace is not opened.");
    }
    return folder.uri;
  }

  resolveJournalDir(): vscode.Uri {
    const baseDir = this.getBaseDir();
    const root = this.getWorkspaceRoot();
    return vscode.Uri.joinPath(root, baseDir);
  }

  getHabitTasks() {
    return this.configService.getHabitTasks();
  }

  resolveNoteUri(date: string): vscode.Uri {
    return vscode.Uri.joinPath(this.resolveJournalDir(), `${date}.md`);
  }

  getLogLevel(): string {
    const config = vscode.workspace.getConfiguration("ptuneTask");
    return config.get<string>("logLevel") || "info";
  }
}
