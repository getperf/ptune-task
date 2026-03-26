import { DailyNotesReflectionDocument } from "../models/DailyNotesReflectionDocument";
import { ReviewOutputFormat } from "../../../config/types";
import { i18n } from "../../../shared/i18n/I18n";
import { escapeMarkdownDisplayText } from "./escapeMarkdownDisplayText";

export type DailyNotesReflectionBuildOptions = {
  xmindFileLink?: string;
  xmindInputFileLink?: string;
};

export class DailyNotesReflectionBuilder {
  build(
    doc: DailyNotesReflectionDocument,
    outputFormat: ReviewOutputFormat,
    options?: DailyNotesReflectionBuildOptions,
  ): string {
    if (outputFormat === "xmind") {
      return this.buildXmind(doc, options);
    }

    return this.buildOutline(doc);
  }

  private buildOutline(doc: DailyNotesReflectionDocument): string {
    const lines = [
      buildCommentBlock(i18n.common.daily.reviewpoint.comment.outline),
      "",
      ...this.buildOutlineLines(doc),
    ];

    return lines.join("\n").trim();
  }

  private buildXmind(
    _doc: DailyNotesReflectionDocument,
    options?: DailyNotesReflectionBuildOptions,
  ): string {
    const t = i18n.common.daily.reviewpoint;
    const lines = [
      buildCommentBlock(t.comment.xmind),
      "",
    ];

    if (options?.xmindFileLink) {
      lines.push(`[${t.xmindFileLinkLabel}](${options.xmindFileLink})`, "");
    }

    if (options?.xmindInputFileLink) {
      lines.push(`[${t.xmindInputFileLinkLabel}](${options.xmindInputFileLink})`, "");
    }

    lines.push(
      `**${t.xmindOutputHeading}**`,
      "",
      wrapWithCodeBlock("", "text"),
    );

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

  buildXmindInput(doc: DailyNotesReflectionDocument): string {
    const lines: string[] = [];

    for (const project of doc.projects) {
      lines.push(project.projectTitle);

      for (const note of project.notes) {
        lines.push(`\t${note.noteTitle}`);

        for (const sentence of note.sentences) {
          lines.push(`\t\t${sentence.text}`);
        }
      }
    }

    return lines.join("\n");
  }
}

function buildCommentBlock(lines: readonly string[]): string {
  return ["<!--", ...lines, "-->"].join("\n");
}

function wrapWithCodeBlock(content: string, language: string): string {
  return `\`\`\`${language}\n${content}\n\`\`\``;
}
