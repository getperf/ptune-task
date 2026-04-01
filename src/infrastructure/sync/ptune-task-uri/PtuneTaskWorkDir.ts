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
