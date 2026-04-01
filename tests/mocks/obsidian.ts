export class Plugin {}

export class Setting {}

export class Notice {
  constructor(public readonly message: string) {}
}

export function normalizePath(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/+/g, "/");
}
