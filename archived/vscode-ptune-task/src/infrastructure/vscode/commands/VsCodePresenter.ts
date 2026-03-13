// src/infrastructure/vscode/commands/VsCodePresenter.ts

import * as vscode from "vscode";
import { DailyNote } from "../../../domain/daily/DailyNote";
import { CalendarViewProvider } from "../calendar/CalendarViewProvider";
import { scrollToBody } from "./scrollToBody";
import { PullTodayPresenter } from "../../../presentation/pull/PullTodayCommand";
import { ReviewPresenter } from "../../../presentation/review/ReviewCommand";
import { PushPresenter } from "../../../presentation/push/PushPresenter";

export class VsCodePresenter
  implements PullTodayPresenter, PushPresenter, ReviewPresenter
{
  private readonly output = vscode.window.createOutputChannel("Ptune Task");

  constructor(private readonly calendarViewProvider: CalendarViewProvider) {}

  // -----------------------------
  // 共通UI
  // -----------------------------

  showInfo(message: string): void {
    vscode.window.showInformationMessage(message);
  }

  showError(message: string): void {
    vscode.window.showErrorMessage(message);
  }

  showWarningWithDetails(message: string, details: string): void {
    vscode.window.showWarningMessage(message);

    this.output.clear();
    this.output.appendLine(details);
    this.output.show(true);
  }

  async saveActiveEditor(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;

    if (editor.document.isDirty) {
      await editor.document.save();
    }
  }

  // -----------------------------
  // ノート操作
  // -----------------------------

  async openNote(note: DailyNote): Promise<void> {
    const uri = vscode.Uri.file(note.filePath);

    const doc = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(doc, {
      preview: false,
    });

    scrollToBody(editor);
  }

  async refreshCalendar(): Promise<void> {
    await this.calendarViewProvider.refreshCalendar();
  }
}
