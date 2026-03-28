import { App, FileSystemAdapter, normalizePath } from "obsidian";

export class PtuneTaskWorkDir {
  constructor(private readonly app: App) {}

  async ensureRootExists(): Promise<void> {
    const root = this.getRootRelative();
    if (!(await this.app.vault.adapter.exists(root))) {
      await this.app.vault.adapter.mkdir(root);
    }
  }

  async ensureInteropDirExists(): Promise<void> {
    await this.ensureRootExists();
    const interopDir = this.getInteropRelative();
    if (!(await this.app.vault.adapter.exists(interopDir))) {
      await this.app.vault.adapter.mkdir(interopDir);
    }
  }

  async ensureConfigDirExists(): Promise<void> {
    await this.ensureRootExists();
    const configDir = this.getConfigRelative();
    if (!(await this.app.vault.adapter.exists(configDir))) {
      await this.app.vault.adapter.mkdir(configDir);
    }
  }

  async ensureRunCleanupConfigExists(): Promise<void> {
    await this.ensureConfigDirExists();
    const configPath = this.getRunCleanupConfigRelative();
    if (!(await this.app.vault.adapter.exists(configPath))) {
      await this.app.vault.adapter.write(
        configPath,
        `${JSON.stringify({ profile: "prod" }, null, 2)}\n`,
      );
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

  getInteropRelative(): string {
    return normalizePath(`${this.getRootRelative()}/interop`);
  }

  getInteropAbsolute(): string {
    return normalizePath(`${this.getRootAbsolute()}/interop`);
  }

  getRunsRelative(): string {
    return normalizePath(`${this.getRootRelative()}/runs`);
  }

  getRunsAbsolute(): string {
    return normalizePath(`${this.getRootAbsolute()}/runs`);
  }

  getConfigRelative(): string {
    return normalizePath(`${this.getRootRelative()}/config`);
  }

  getConfigAbsolute(): string {
    return normalizePath(`${this.getRootAbsolute()}/config`);
  }

  getRunCleanupConfigRelative(): string {
    return normalizePath(`${this.getConfigRelative()}/run-cleanup.json`);
  }

  getRunCleanupConfigAbsolute(): string {
    return normalizePath(`${this.getConfigAbsolute()}/run-cleanup.json`);
  }

  getRunDirRelative(requestId: string): string {
    return normalizePath(`${this.getRunsRelative()}/${requestId}`);
  }

  getRunDirAbsolute(requestId: string): string {
    return normalizePath(`${this.getRunsAbsolute()}/${requestId}`);
  }

  getRequestFileRelative(): string {
    return normalizePath(`${this.getInteropRelative()}/request.json`);
  }

  getRequestFileAbsolute(): string {
    return normalizePath(`${this.getInteropAbsolute()}/request.json`);
  }

  getStatusFileRelative(): string {
    return normalizePath(`${this.getInteropRelative()}/status.json`);
  }

  getStatusFileAbsolute(): string {
    return normalizePath(`${this.getInteropAbsolute()}/status.json`);
  }

  getInputFileRelative(): string {
    return normalizePath(`${this.getInteropRelative()}/input.json`);
  }

  getInputFileAbsolute(): string {
    return normalizePath(`${this.getInteropAbsolute()}/input.json`);
  }

  private getBasePath(): string {
    const adapter = this.app.vault.adapter;

    if (!(adapter instanceof FileSystemAdapter)) {
      throw new Error("Ptune task URI is only supported on desktop");
    }

    return adapter.getBasePath();
  }
}
