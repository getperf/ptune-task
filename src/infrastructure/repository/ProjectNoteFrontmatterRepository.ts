import { App, TFile } from "obsidian";
import { MarkdownFile } from "md-ast-core";
import { NoteSummary } from "../../domain/note/NoteSummary";
import { normalizeNoteSummarySentences } from "../../domain/note/normalizeNoteSummarySentences";
import { parseLegacySummaryText } from "../../domain/note/parseLegacySummaryText";
import type { EditableNoteSummary } from "../../application/note_review/models/EditableNoteSummary";

export class ProjectNoteFrontmatterRepository {
  constructor(private readonly app: App) {}

  async read(file: TFile): Promise<NoteSummary> {
    const text = await this.app.vault.read(file);
    const md = MarkdownFile.parse(text);
    const fm = md.getFrontmatter();

    return new NoteSummary({
      notePath: file.path,
      noteFolder: dirname(file.path),
      createdAt:
        asString(fm.get("createdAt"))
        ?? asString(fm.get("created"))
        ?? new Date(file.stat.ctime).toISOString(),
      summarySentences: readSummarySentences(fm.get("summary")),
      summarySegmentsMarkdown: asString(fm.get("summary_segments")) ?? "",
      dailynote: asString(fm.get("dailynote")) ?? undefined,
      taskKey: asString(fm.get("taskKey")) ?? undefined,
      goal: asString(fm.get("goal")) ?? undefined,
      tags: [],
    });
  }

  async readBody(file: TFile): Promise<string> {
    const text = await this.app.vault.read(file);
    return MarkdownFile.parse(text).getBody().trim();
  }

  async saveSummary(file: TFile, summary: string | readonly string[] | EditableNoteSummary): Promise<void> {
    const text = await this.app.vault.read(file);
    const md = MarkdownFile.parse(text);
    const frontmatter = md.getFrontmatter();
    if (isEditableNoteSummary(summary)) {
      frontmatter.set("summary", normalizeNoteSummarySentences(summary.summary));
      frontmatter.set("summary_segments", summary.summarySegmentsMarkdown.trim());
    } else {
      frontmatter.set("summary", normalizeNoteSummarySentences(summary));
    }
    await this.app.vault.modify(file, md.toString());
  }
}

function isEditableNoteSummary(value: unknown): value is EditableNoteSummary {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const asRecord = value as Record<string, unknown>;
  return typeof asRecord.summary === "string"
    && typeof asRecord.summarySegmentsMarkdown === "string";
}

function readSummarySentences(value: unknown): string[] {
  if (Array.isArray(value)) {
    return normalizeNoteSummarySentences(value.filter((item): item is string => typeof item === "string"));
  }

  if (typeof value === "string") {
    return parseLegacySummaryText(value);
  }

  return [];
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function dirname(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const index = normalized.lastIndexOf("/");
  return index >= 0 ? normalized.slice(0, index) : "";
}
