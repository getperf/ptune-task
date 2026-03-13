import { App } from "obsidian";
import { PtuneSyncWorkDir } from "./PtuneSyncWorkDir";

export class PtuneSyncInputFileWriter {
  constructor(
    private readonly app: App,
    private readonly workDir: PtuneSyncWorkDir,
  ) {}

  async writeDiffInput(payload: string): Promise<string> {
    const path = this.workDir.getDiffInputFile();
    await this.app.vault.adapter.write(path, payload);
    return path;
  }

  async writePushInput(payload: string): Promise<string> {
    const path = this.workDir.getPushInputFile();
    await this.app.vault.adapter.write(path, payload);
    return path;
  }
}
