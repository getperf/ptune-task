import { DailyNotesReflectionDocument } from "../models/DailyNotesReflectionDocument";
import { StructuredReflectionText } from "../services/StructuredReflectionTextAdapter";
import { ReflectionFormatter, ReflectionBuildOptions } from "./ReflectionFormatter";
import { i18n } from "../../../shared/i18n/I18n";
import { escapeMarkdownDisplayText } from "../builders/escapeMarkdownDisplayText";

export class OutlineReflectionFormatter implements ReflectionFormatter {
  build(doc: DailyNotesReflectionDocument, _options?: ReflectionBuildOptions): string {
    const lines = [
      buildCommentBlock(i18n.common.daily.reviewpoint.comment.outline),
      "",
      ...this.buildOutlineLines(doc),
    ];

    return lines.join("\n").trim();
  }

  buildManual(_options?: ReflectionBuildOptions): string {
    return buildCommentBlock(i18n.common.daily.reviewpoint.comment.manualOutline);
  }

  buildStructured(structured: StructuredReflectionText, _options?: ReflectionBuildOptions): string {
    const lines = [
      buildCommentBlock(i18n.common.daily.reviewpoint.comment.outline),
      "",
      ...this.buildStructuredOutlineLines(structured),
    ];

    return lines.join("\n").trim();
  }

  private buildOutlineLines(doc: DailyNotesReflectionDocument): string[] {
    const lines: string[] = [];

    for (const project of doc.projects) {
      lines.push(`- ${escapeMarkdownDisplayText(project.projectTitle)}`);

      for (const note of project.notes) {
        lines.push(`  - ${escapeMarkdownDisplayText(note.noteTitle)}`);

        for (const sentence of note.sentences) {
          lines.push(`    - ${escapeMarkdownDisplayText(sentence.text)}`);
        }
      }
    }

    return lines;
  }

  private buildStructuredOutlineLines(structured: StructuredReflectionText): string[] {
    const lines: string[] = [];

    for (const folder of structured.folders) {
      lines.push(`- ${escapeMarkdownDisplayText(folder.folderTitle)}`);

      for (const note of folder.notes) {
        lines.push(`  - ${escapeMarkdownDisplayText(note.noteTitle)}`);

        for (const sentence of note.sentences) {
          lines.push(`    - ${escapeMarkdownDisplayText(sentence)}`);
        }
      }
    }

    return lines;
  }
}

function buildCommentBlock(lines: readonly string[]): string {
  return ["<!--", ...lines, "-->"].join("\n");
}
