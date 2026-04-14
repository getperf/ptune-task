import { shell } from "electron";

export class PtuneSyncUriLauncher {
  async launch(uri: string): Promise<void> {
    if (typeof shell.openExternal !== "function") {
      throw new Error("Electron shell is unavailable");
    }

    await shell.openExternal(uri);
  }
}
