import { App, FileSystemAdapter, normalizePath } from "obsidian";

export class PtuneTaskWorkDir {
  constructor(private readonly app: App) {}

  async ensureRootExists(): Promise<void> {
    const root = this.getRootRelative();
    if (!(await this.app.vault.adapter.exists(root))) {
      await this.app.vault.adapter.mkdir(root);
    }
  }

  async ensureRunDirExists(requestId: string): Promise<void> {
    await this.ensureRootExists();
    const runsDir = this.getRunsRelative();
    if (!(await this.app.vault.adapter.exists(runsDir))) {
      await this.app.vault.adapter.mkdir(runsDir);
    }
    const runDir = this.getRunDirRelative(requestId);
    if (!(await this.app.vault.adapter.exists(runDir))) {
      await this.app.vault.adapter.mkdir(runDir);
    }
  }

  getRootRelative(): string {
    return normalizePath(`${this.app.vault.configDir}/plugins/ptune-task/work`);
  }

  getRootAbsolute(): string {
    return normalizePath(`${this.getBasePath()}/${this.getRootRelative()}`);
  }

  getRunsRelative(): string {
    return normalizePath(`${this.getRootRelative()}/runs`);
  }

  getRunsAbsolute(): string {
    return normalizePath(`${this.getRootAbsolute()}/runs`);
  }

  getRunDirRelative(requestId: string): string {
    return normalizePath(`${this.getRunsRelative()}/${requestId}`);
  }

  getRunDirAbsolute(requestId: string): string {
    return normalizePath(`${this.getRunsAbsolute()}/${requestId}`);
  }

  getRequestFileRelative(requestId: string): string {
    return normalizePath(`${this.getRunDirRelative(requestId)}/request.json`);
  }

  getRequestFileAbsolute(requestId: string): string {
    return normalizePath(`${this.getRunDirAbsolute(requestId)}/request.json`);
  }

  getStatusFileRelative(requestId: string): string {
    return normalizePath(`${this.getRunDirRelative(requestId)}/status.json`);
  }

  getStatusFileAbsolute(requestId: string): string {
    return normalizePath(`${this.getRunDirAbsolute(requestId)}/status.json`);
  }

  private getBasePath(): string {
    const adapter = this.app.vault.adapter;

    if (!(adapter instanceof FileSystemAdapter)) {
      throw new Error("Ptune task URI is only supported on desktop");
    }

    return adapter.getBasePath();
  }
}
