// src/shared/logger/Logger.ts
import * as vscode from "vscode";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LoggerOptions {
  level: LogLevel;
}

export class Logger {
  private static instance: Logger;

  private readonly channel: vscode.LogOutputChannel;
  private level: LogLevel;

  private constructor(options: LoggerOptions) {
    this.channel = vscode.window.createOutputChannel("Ptune Task", {
      log: true,
    });

    this.level = options.level;
  }

  static initialize(options: LoggerOptions): void {
    if (!Logger.instance) {
      Logger.instance = new Logger(options);
    }
  }

  static get(): Logger {
    if (!Logger.instance) {
      throw new Error("Logger not initialized");
    }
    return Logger.instance;
  }

  updateLevel(level: LogLevel): void {
    this.level = level;
    this.info("Log level changed to", level);
  }

  // -------------------------------
  // 可変長引数対応
  // -------------------------------

  debug(...args: unknown[]): void {
    if (this.shouldLog("debug")) {
      this.channel.debug(this.format(args));
    }
  }

  info(...args: unknown[]): void {
    if (this.shouldLog("info")) {
      this.channel.info(this.format(args));
    }
  }

  warn(...args: unknown[]): void {
    if (this.shouldLog("warn")) {
      this.channel.warn(this.format(args));
    }
  }

  error(...args: unknown[]): void {
    if (this.shouldLog("error")) {
      this.channel.error(this.format(args));
    }
  }

  show(): void {
    this.channel.show(true);
  }

  private format(args: unknown[]): string {
    return args
      .map((arg) => {
        if (typeof arg === "string") return arg;
        if (arg instanceof Error) return arg.stack ?? arg.message;
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      })
      .join(" ");
  }

  private shouldLog(level: LogLevel): boolean {
    const order: LogLevel[] = ["debug", "info", "warn", "error"];
    return order.indexOf(level) >= order.indexOf(this.level);
  }
}
