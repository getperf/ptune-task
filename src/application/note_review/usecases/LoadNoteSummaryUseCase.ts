import { TFile } from "obsidian";
import { ProjectNoteFrontmatterRepository } from "../../../infrastructure/repository/ProjectNoteFrontmatterRepository";
import type { EditableNoteSummary } from "../models/EditableNoteSummary";

export class LoadNoteSummaryUseCase {
  constructor(private readonly repository: ProjectNoteFrontmatterRepository) {}

  async execute(file: TFile): Promise<EditableNoteSummary> {
    const note = await this.repository.read(file);
    return {
      summary: note.summary ?? "",
      summarySegmentsMarkdown: note.summarySegmentsMarkdown,
    };
  }
}
