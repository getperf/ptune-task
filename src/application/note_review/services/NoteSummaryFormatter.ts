export class NoteSummaryFormatter {
  format(value: string): string {
    return value
      .split("\n")
      .map((line) => this.normalizeLine(line))
      .filter((line) => line.length > 0)
      .join("\n");
  }

  private normalizeLine(line: string): string {
    return line
      .trim()
      .replace(/^[-*•]\s+/, "")
      .replace(/^\d+\.\s+/, "")
      .replace(/\s+/g, " ");
  }
}
