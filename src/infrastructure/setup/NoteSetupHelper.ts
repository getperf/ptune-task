import { App } from "obsidian";

export type NoteSetupResult = {
  createdPaths: string[];
  updatedTemplates: string[];
};

export class NoteSetupHelper {
  private static readonly TARGET_DIRS = [
    "_project",
    "_journal",
  ] as const;

  constructor(private readonly app: App) {}

  async ensureResources(): Promise<NoteSetupResult> {
    const createdPaths: string[] = [];
    const updatedTemplates: string[] = [];

    for (const path of NoteSetupHelper.TARGET_DIRS) {
      if (!(await this.app.vault.adapter.exists(path))) {
        await this.app.vault.createFolder(path);
        createdPaths.push(path);
      }
    }

    return { createdPaths, updatedTemplates };
  }
}
