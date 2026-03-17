import { normalizeNoteSummaryText } from "../../../domain/note/normalizeNoteSummaryText";

export class NoteSummaryFormatter {
  format(value: string): string {
    const normalizedLines = value
      .split("\n")
      .map((line) => this.normalizeLine(line))
      .filter((line) => line.length > 0);

    return normalizeNoteSummaryText(normalizedLines.join("\n"));
  }

  private normalizeLine(line: string): string {
    return line
      .trim()
      .replace(/^[-*•]\s+/, "")
      .replace(/^\d+\.\s+/, "")
      .replace(/\s+/g, " ");
  }
}
