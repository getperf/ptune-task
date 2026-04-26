export class Plugin { }

export class Setting { }

export class Notice {
  constructor(public readonly message: string) { }
}

export class Modal {
  constructor(public readonly app: unknown) { }
  open(): void { }
  close(): void { }
  setCloseCallback(_callback: () => void): void { }
}

export const Platform = {
  isMac: false,
  isWin: true,
  isLinux: false,
};

export function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/+/g, "/");
}
