import { App, FileSystemAdapter, normalizePath } from "obsidian";

export class PtuneSyncWorkDir {
  constructor(private readonly app: App) {}

  getRootRelative(): string {
    return normalizePath(`${this.app.vault.configDir}/plugins/ptune-task/work`);
  }

  getRootAbsolute(): string {
    const adapter = this.app.vault.adapter;

    if (!(adapter instanceof FileSystemAdapter)) {
      throw new Error("Ptune sync URI is only supported on desktop");
    }

    return normalizePath(
      `${adapter.getBasePath()}/${this.getRootRelative()}`,
    );
  }

  getStatusFile(): string {
    return normalizePath(`${this.getRootRelative()}/status.json`);
  }

  getStatusFileAbsolute(): string {
    return normalizePath(`${this.getRootAbsolute()}/status.json`);
  }

  getEventsLogFile(): string {
    return normalizePath(`${this.getRootRelative()}/events.log`);
  }

  getEventsLogFileAbsolute(): string {
    return normalizePath(`${this.getRootAbsolute()}/events.log`);
  }

  getDiffInputFile(): string {
    return normalizePath(`${this.getRootRelative()}/diff-input.json`);
  }

  getDiffInputFileAbsolute(): string {
    return normalizePath(`${this.getRootAbsolute()}/diff-input.json`);
  }

  getPushInputFile(): string {
    return normalizePath(`${this.getRootRelative()}/push-input.json`);
  }

  getPushInputFileAbsolute(): string {
    return normalizePath(`${this.getRootAbsolute()}/push-input.json`);
  }

  async ensureExists(): Promise<void> {
    if (!(await this.app.vault.adapter.exists(this.getRootRelative()))) {
      await this.app.vault.adapter.mkdir(this.getRootRelative());
    }
  }
}
