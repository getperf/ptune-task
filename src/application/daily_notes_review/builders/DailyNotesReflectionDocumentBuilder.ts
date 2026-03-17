import { NoteSummaries } from "../../../domain/note/NoteSummaries";
import { splitNoteSummaryIntoSentences } from "../../../domain/note/splitNoteSummaryIntoSentences";
import { DailyNotesReflectionDocument, ReflectionProject, ReflectionSentence } from "../models/DailyNotesReflectionDocument";

export class DailyNotesReflectionDocumentBuilder {
  build(summaries: NoteSummaries): DailyNotesReflectionDocument {
    const projects: ReflectionProject[] = summaries.getFolders().map((folder) => ({
      projectTitle: this.resolveProjectTitle(folder.folderPath),
      notes: folder.getNotes().map((note) => ({
        noteTitle: note.noteTitle,
        sentences: this.buildSentences(note.summary),
      })),
    }));

    return new DailyNotesReflectionDocument(projects);
  }

  private buildSentences(summary: string | null): ReflectionSentence[] {
    if (!summary?.trim()) {
      return [{ text: "(summary missing)" }];
    }

    return splitNoteSummaryIntoSentences(summary).map((line) => ({ text: line }));
  }

  private resolveProjectTitle(folderPath: string): string {
    const last = folderPath.split("/").pop() ?? folderPath;
    return last.replace(/^[^_]+_/, "");
  }
}
