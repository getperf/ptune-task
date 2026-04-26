import { DailyNotesReflectionDocument } from "../models/DailyNotesReflectionDocument";
import { StructuredReflectionText } from "../services/StructuredReflectionTextAdapter";
import { ReflectionFormatter, ReflectionBuildOptions } from "./ReflectionFormatter";
import { i18n } from "../../../shared/i18n/I18n";

export class XMindReflectionFormatter implements ReflectionFormatter {
  build(doc: DailyNotesReflectionDocument, options?: ReflectionBuildOptions): string {
    return this.buildXmind(options);
  }

  buildManual(options?: ReflectionBuildOptions): string {
    return this.buildManualXmind(options);
  }

  buildStructured(_structured: StructuredReflectionText, options?: ReflectionBuildOptions): string {
    return this.buildXmind(options);
  }

  buildInput(doc: DailyNotesReflectionDocument): string {
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

  buildStructuredInput(structured: StructuredReflectionText): string {
    const lines: string[] = [];

    for (const folder of structured.folders) {
      lines.push(folder.folderTitle);

      for (const note of folder.notes) {
        lines.push(`\t${note.noteTitle}`);

        for (const sentence of note.sentences) {
          lines.push(`\t\t${sentence}`);
        }
      }
    }

    return lines.join("\n");
  }

  private buildXmind(options?: ReflectionBuildOptions): string {
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

    lines.push(`**${t.xmindOutputHeading}**`, "", wrapWithCodeBlock("", "text"));

    return lines.join("\n").trim();
  }

  private buildManualXmind(options?: ReflectionBuildOptions): string {
    const t = i18n.common.daily.reviewpoint;
    const lines = [
      buildCommentBlock(t.comment.manualXmind),
      "",
    ];

    if (options?.xmindFileLink) {
      lines.push(`[${t.xmindFileLinkLabel}](${options.xmindFileLink})`, "");
    }

    if (options?.xmindInputFileLink) {
      lines.push(`[${t.xmindInputFileLinkLabel}](${options.xmindInputFileLink})`, "");
    }

    lines.push(`**${t.xmindOutputHeading}**`, "", wrapWithCodeBlock("", "text"));

    return lines.join("\n").trim();
  }
}

function buildCommentBlock(lines: readonly string[]): string {
  return ["<!--", ...lines, "-->"].join("\n");
}

function wrapWithCodeBlock(content: string, language: string): string {
  return `\`\`\`${language}\n${content}\n\`\`\``;
}
