import { PullQuery } from "../../../application/sync/shared/dto/PullQuery";
import { PushQuery } from "../../../application/sync/shared/dto/PushQuery";
import { App, normalizePath } from "obsidian";
import { logger } from "../../../shared/logger/loggerInstance";
import { PtuneTaskWorkDir } from "./PtuneTaskWorkDir";

export class PtuneTaskRequestFileWriter {
  constructor(
    private readonly app: App,
    private readonly workDir: PtuneTaskWorkDir,
  ) {}

  async write(command: "auth-status" | "auth-login"): Promise<{
    requestId: string;
    requestFile: string;
    statusFile: string;
  }> {
    const requestId = this.generateRequestId();
    await this.workDir.ensureRunDirExists(requestId);

    const requestFile = this.workDir.getRequestFileRelative(requestId);
    const runDir = this.workDir.getRunDirAbsolute(requestId);
    const home = this.workDir.getRootAbsolute();
    const statusFile = this.workDir.getStatusFileAbsolute(requestId);
    const requestPayload = {
      schema_version: 1,
      request_id: requestId,
      command,
      created_at: new Date().toISOString(),
      home,
      status_file: statusFile,
      workspace: {
        run_dir: runDir,
        status_file: statusFile,
      },
    };

    await this.writeAtomic(requestFile, JSON.stringify(requestPayload, null, 2));

    logger.debug(
      `[Sync] [PtuneTaskRequestFileWriter] command=${command} requestId=${requestId} requestFile=${requestFile}`,
    );

    return {
      requestId,
      requestFile: this.workDir.getRequestFileAbsolute(requestId),
      statusFile,
    };
  }

  async writePull(query: PullQuery): Promise<{
    requestId: string;
    requestFile: string;
    statusFile: string;
  }> {
    const requestId = this.generateRequestId();
    await this.workDir.ensureRunDirExists(requestId);

    const requestFile = this.workDir.getRequestFileRelative(requestId);
    const runDir = this.workDir.getRunDirAbsolute(requestId);
    const home = this.workDir.getRootAbsolute();
    const statusFile = this.workDir.getStatusFileAbsolute(requestId);
    const requestPayload = {
      schema_version: 1,
      request_id: requestId,
      command: "pull",
      created_at: new Date().toISOString(),
      home,
      status_file: statusFile,
      workspace: {
        run_dir: runDir,
        status_file: statusFile,
      },
      args: {
        list: query.list,
        include_completed: query.includeCompleted === true,
      },
    };

    await this.writeAtomic(requestFile, JSON.stringify(requestPayload, null, 2));

    logger.debug(
      `[Sync] [PtuneTaskRequestFileWriter] command=pull requestId=${requestId} requestFile=${requestFile}`,
    );

    return {
      requestId,
      requestFile: this.workDir.getRequestFileAbsolute(requestId),
      statusFile,
    };
  }

  async writeDiff(query: PushQuery, payload: string): Promise<{
    requestId: string;
    requestFile: string;
    statusFile: string;
    inputFile: string;
  }> {
    return this.writeTaskCommand("diff", query, payload);
  }

  async writePush(query: PushQuery, payload: string): Promise<{
    requestId: string;
    requestFile: string;
    statusFile: string;
    inputFile: string;
  }> {
    return this.writeTaskCommand("push", query, payload);
  }

  private async writeTaskCommand(
    command: "diff" | "push",
    query: PushQuery,
    payload: string,
  ): Promise<{
    requestId: string;
    requestFile: string;
    statusFile: string;
    inputFile: string;
  }> {
    const requestId = this.generateRequestId();
    await this.workDir.ensureRunDirExists(requestId);

    const requestFile = this.workDir.getRequestFileRelative(requestId);
    const runDir = this.workDir.getRunDirAbsolute(requestId);
    const home = this.workDir.getRootAbsolute();
    const statusFile = this.workDir.getStatusFileAbsolute(requestId);
    const inputFile = this.workDir.getInputFileRelative(requestId);
    const inputFileAbsolute = this.workDir.getInputFileAbsolute(requestId);

    await this.writeAtomic(inputFile, payload);

    const requestPayload = {
      schema_version: 1,
      request_id: requestId,
      command,
      created_at: new Date().toISOString(),
      home,
      status_file: statusFile,
      workspace: {
        run_dir: runDir,
        status_file: statusFile,
      },
      input: {
        task_json_file: inputFileAbsolute,
      },
      args: {
        list: query.list,
        allow_delete: query.allowDelete === true,
      },
    };

    await this.writeAtomic(requestFile, JSON.stringify(requestPayload, null, 2));

    logger.debug(
      `[Sync] [PtuneTaskRequestFileWriter] command=${command} requestId=${requestId} requestFile=${requestFile} inputFile=${inputFile}`,
    );

    return {
      requestId,
      requestFile: this.workDir.getRequestFileAbsolute(requestId),
      statusFile,
      inputFile: inputFileAbsolute,
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
