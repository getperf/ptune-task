import { App, normalizePath } from "obsidian";
import { logger } from "../../../shared/logger/loggerInstance";
import { PtuneTaskWorkDir } from "./PtuneTaskWorkDir";

type PtuneTaskCommand = "auth-status";

export class PtuneTaskRequestFileWriter {
  constructor(
    private readonly app: App,
    private readonly workDir: PtuneTaskWorkDir,
  ) {}

  async write(command: PtuneTaskCommand): Promise<{
    requestId: string;
    requestFile: string;
    statusFile: string;
  }> {
    const requestId = this.generateRequestId();
    await this.workDir.ensureRunDirExists(requestId);

    const requestFile = this.workDir.getRequestFileRelative(requestId);
    const home = this.workDir.getRootAbsolute();
    const statusFile = this.workDir.getStatusFileAbsolute(requestId);
    const payload = {
      schema_version: 1,
      request_id: requestId,
      command,
      created_at: new Date().toISOString(),
      home,
      status_file: statusFile,
    };

    await this.writeAtomic(requestFile, JSON.stringify(payload, null, 2));

    logger.debug(
      `[Sync] [PtuneTaskRequestFileWriter] command=${command} requestId=${requestId} requestFile=${requestFile}`,
    );

    return {
      requestId,
      requestFile: this.workDir.getRequestFileAbsolute(requestId),
      statusFile,
    };
  }

  private async writeAtomic(path: string, content: string): Promise<void> {
    const tmpPath = normalizePath(`${path}.tmp`);
    await this.app.vault.adapter.write(tmpPath, content);
    if (await this.app.vault.adapter.exists(path)) {
      await this.app.vault.adapter.remove(path);
    }
    await this.app.vault.adapter.rename(tmpPath, path);
  }

  private generateRequestId(): string {
    const iso = new Date().toISOString().replace(/[-:]/g, "").replace(/\.(\d{3})Z$/, "$1Z");
    const suffix = Math.random().toString(16).slice(2, 10).padEnd(8, "0");
    return `${iso}-${suffix}`;
  }
}
