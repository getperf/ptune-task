import { NoteProjectFolder } from "../../../domain/note/NoteProjectFolder";
import { NoteSummaries } from "../../../domain/note/NoteSummaries";
import { ReviewOutputFormat } from "../../../config/types";

export class DailyNotesReportBuilder {
  build(summaries: NoteSummaries, outputFormat: ReviewOutputFormat): string {
    if (outputFormat === "xmind") {
      return this.buildOutliner(summaries);
    }

    return this.buildOutliner(summaries);
  }

  private buildOutliner(summaries: NoteSummaries): string {
    const lines: string[] = [];

    for (const folder of summaries.getFolders()) {
      lines.push(`- ${folderTitle(folder)}`);

      for (const note of folder.getNotes()) {
        lines.push(`  - [${escapeLinkLabel(note.noteTitle)}](${encodeLinkDestination(note.notePath)})`);
        if (note.summary?.trim()) {
          lines.push(formatSummaryLines(note.summary.trim(), "    "));
        } else {
          lines.push("    - (summary missing)");
        }
      }

      lines.push("");
    }

    return lines.join("\n").trim();
  }
}

function folderTitle(folder: NoteProjectFolder): string {
  const last = folder.folderPath.split("/").pop() ?? folder.folderPath;
  return last.replace(/^[^_]+_/, "");
}

function formatSummaryLines(value: string, prefix: string): string {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => `${prefix}- ${line}`)
    .join("\n");
}

function escapeLinkLabel(value: string): string {
  return value.replace(/[[\]]/g, "\\$&");
}

function encodeLinkDestination(value: string): string {
  return value
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}
