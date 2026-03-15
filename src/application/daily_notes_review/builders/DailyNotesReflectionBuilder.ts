import { DailyNotesReflectionDocument } from "../models/DailyNotesReflectionDocument";

export class DailyNotesReflectionBuilder {
  build(doc: DailyNotesReflectionDocument): string {
    const lines: string[] = [];

    for (const project of doc.projects) {
      lines.push(`- ${project.projectTitle}`);

      for (const note of project.notes) {
        lines.push(`  - ${note.noteTitle}`);

        for (const sentence of note.sentences) {
          lines.push(`    - ${sentence.text}`);
        }
      }
    }

    return lines.join("\n").trim();
  }
}
