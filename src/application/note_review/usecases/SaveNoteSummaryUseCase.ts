import { TFile } from "obsidian";
import { ProjectNoteFrontmatterRepository } from "../../../infrastructure/repository/ProjectNoteFrontmatterRepository";
import type { EditableNoteSummary } from "../models/EditableNoteSummary";

export class SaveNoteSummaryUseCase {
  constructor(private readonly repository: ProjectNoteFrontmatterRepository) {}

  async execute(file: TFile, summary: EditableNoteSummary): Promise<void> {
    await this.repository.saveSummary(file, summary);
  }
}
