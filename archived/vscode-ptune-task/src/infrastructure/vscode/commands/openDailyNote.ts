import * as vscode from "vscode";
import { DailyNote } from "../../../domain/daily/DailyNote";
import { scrollToBody } from "./scrollToBody";

export async function openDailyNote(
  note: DailyNote,
): Promise<vscode.TextEditor> {
  const uri = vscode.Uri.file(note.filePath);

  const doc = await vscode.workspace.openTextDocument(uri);
  const editor = await vscode.window.showTextDocument(doc, { preview: false, });

  scrollToBody(editor);

  return editor;
}