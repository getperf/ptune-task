import { DailyNotesReflectionDocument } from "../models/DailyNotesReflectionDocument";
import { StructuredReflectionText } from "../services/StructuredReflectionTextAdapter";
import { ReflectionFormatter, ReflectionBuildOptions } from "./ReflectionFormatter";
import { i18n } from "../../../shared/i18n/I18n";
import { escapeMarkdownDisplayText } from "../builders/escapeMarkdownDisplayText";

export class LogseqReflectionFormatter implements ReflectionFormatter {
  build(doc: DailyNotesReflectionDocument, options?: ReflectionBuildOptions): string {
    return this.buildLogseq(options);
  }

  buildManual(options?: ReflectionBuildOptions): string {
    return this.buildLogseq(options);
  }

  buildStructuredInput(structured: StructuredReflectionText): string {
    return this.formatStructured(structured);
  }

  buildStructured(structured: StructuredReflectionText, options?: ReflectionBuildOptions): string {
    const t = i18n.common.daily.reviewpoint;
    const logseqCommentLines = Array.isArray(t.comment?.logseq)
      ? (t.comment.logseq as string[])
      : [];
    const lines: string[] = [
      buildCommentBlock(logseqCommentLines),
      "",
    ];

    if (options?.logseqJournalLink) {
      lines.push(`[${t.logseqJournalLinkLabel}](${options.logseqJournalLink})`, "");
    }

    const content = this.formatStructured(structured);
    lines.push(content);

    return lines.join("\n").trim();
  }

  private formatStructured(structured: StructuredReflectionText): string {
    const lines: string[] = [];
    for (const folder of structured.folders) {
      lines.push(`- ${escapeMarkdownDisplayText(folder.folderTitle)}`);
      for (const note of folder.notes) {
        lines.push(`    - ${escapeMarkdownDisplayText(note.noteTitle)}`);
        for (const sentence of note.sentences) {
          lines.push(`        - ${escapeMarkdownDisplayText(sentence)}`);
        }
      }
    }
    return lines.join("\n");
  }

  private buildLogseq(options?: ReflectionBuildOptions): string {
    const t = i18n.common.daily.reviewpoint;
    const logseqCommentLines = Array.isArray(t.comment?.logseq)
      ? (t.comment.logseq as string[])
      : [];
    const lines: string[] = [
      buildCommentBlock(logseqCommentLines),
      "",
    ];

    if (options?.logseqJournalLink) {
      lines.push(`[${t.logseqJournalLinkLabel}](${options.logseqJournalLink})`, "");
    }

    lines.push("<!-- Logseq reflection output placeholder -->");
    return lines.join("\n").trim();
  }
}

function buildCommentBlock(lines: readonly string[]): string {
  return ["<!--", ...lines, "-->"].join("\n");
}
