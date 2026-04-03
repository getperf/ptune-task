import { TFile } from "obsidian";
import { ProjectNoteFrontmatterRepository } from "../../../infrastructure/repository/ProjectNoteFrontmatterRepository";

export class LoadNoteSummaryUseCase {
  constructor(private readonly repository: ProjectNoteFrontmatterRepository) {}

  async execute(file: TFile): Promise<string> {
    const note = await this.repository.read(file);
    return note.summary ?? "";
  }
}
