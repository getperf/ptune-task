import { TFile } from "obsidian";
import { NoteSummaryGenerator } from "../services/NoteSummaryGenerator";
import type { EditableNoteSummary } from "../models/EditableNoteSummary";

export class PreviewNoteSummaryUseCase {
  constructor(private readonly generator: NoteSummaryGenerator) {}

  async execute(file: TFile): Promise<EditableNoteSummary> {
    const generated = await this.generator.generate(file);
    return {
      summary: generated.summarySentences.join("\n"),
      summarySegmentsMarkdown: generated.summarySegmentsMarkdown,
    };
  }
}
