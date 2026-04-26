import { DailyNotesReflectionDocument } from "../models/DailyNotesReflectionDocument";
import { StructuredReflectionText } from "../services/StructuredReflectionTextAdapter";
import { ReflectionFormatter, ReflectionBuildOptions } from "./ReflectionFormatter";
import { i18n } from "../../../shared/i18n/I18n";

export class LogseqReflectionFormatter implements ReflectionFormatter {
  build(doc: DailyNotesReflectionDocument, options?: ReflectionBuildOptions): string {
    return this.buildLogseq(options);
  }

  buildManual(options?: ReflectionBuildOptions): string {
    return this.buildLogseq(options);
  }

  buildStructured(_structured: StructuredReflectionText, options?: ReflectionBuildOptions): string {
    return this.buildLogseq(options);
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
