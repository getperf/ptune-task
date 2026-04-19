import { normalizeNoteSummarySentences } from "../../../domain/note/normalizeNoteSummarySentences";

export type FormattedNoteSummary = {
  summarySentences: string[];
  summarySegmentsMarkdown: string;
};

export class NoteSummaryFormatter {
  format(value: string): string[] {
    return this.formatWithSegments(value).summarySentences;
  }

  formatWithSegments(value: string): FormattedNoteSummary {
    const parsedObject = this.parseJsonObject(value);
    if (parsedObject) {
      const summarySentences = normalizeNoteSummarySentences(parsedObject.summary);
      return {
        summarySentences,
        summarySegmentsMarkdown: parsedObject.summarySegmentsMarkdown,
      };
    }

    const parsedJson = this.parseJsonArray(value);
    if (parsedJson.length > 0) {
      return {
        summarySentences: normalizeNoteSummarySentences(parsedJson),
        summarySegmentsMarkdown: "",
      };
    }

    return {
      summarySentences: normalizeNoteSummarySentences(value),
      summarySegmentsMarkdown: "",
    };
  }

  private parseJsonObject(value: string): { summary: string[]; summarySegmentsMarkdown: string } | null {
    const normalized = this.stripCodeFence(value);
    if (!normalized.startsWith("{")) {
      return null;
    }

    try {
      const parsed: unknown = JSON.parse(normalized);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return null;
      }
      const asRecord = parsed as Record<string, unknown>;
      const summary = this.coerceStringArray(
        Array.isArray(asRecord.summary) ? asRecord.summary : asRecord.summary_lines,
      );
      const summarySegmentsMarkdown =
        typeof asRecord.summary_segments_markdown === "string"
          ? asRecord.summary_segments_markdown.trim()
          : "";
      return { summary, summarySegmentsMarkdown };
    } catch {
      return null;
    }
  }

  private coerceStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    return value.filter((item): item is string => typeof item === "string");
  }

  private stripCodeFence(value: string): string {
    return value.trim()
      .replace(/^```json\s*/i, "")
      .replace(/^```\s*/i, "")
      .replace(/```$/i, "");
  }

  private parseJsonArray(value: string): string[] {
    const normalized = this.stripCodeFence(value);

    if (!normalized.startsWith("[")) {
      return [];
    }

    try {
      const parsed: unknown = JSON.parse(normalized);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : [];
    } catch {
      return [];
    }
  }
}
