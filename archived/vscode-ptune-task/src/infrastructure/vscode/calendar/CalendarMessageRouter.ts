// src/infrastructure/vscode/calendar/CalendarMessageRouter.ts

import * as vscode from "vscode";
import {
  ExtensionToWebviewMessage,
  WebviewToExtensionMessage,
} from "./messages";
import { CreateDailyNoteUseCase } from "../../../application/calendar/usecases/CreateDailyNoteUseCase";
import { DailyNoteRepository } from "../../repository/DailyNoteRepository";
import { Logger } from "../../../shared/logger/Logger";

export type CalendarMessageRouterDeps = {
  createDailyNote: CreateDailyNoteUseCase;
  repository: DailyNoteRepository;
  postToWebview: (msg: ExtensionToWebviewMessage) => Promise<void> | void;
  nowISODate: () => string;
  executeCommand: (command: string) => Promise<void>;
};

export class CalendarMessageRouter {
  constructor(private readonly deps: CalendarMessageRouterDeps) { }

  async handle(msg: WebviewToExtensionMessage): Promise<void> {
    const logger = Logger.get();
    logger.debug(`CalendarMessageRouter received: ${msg.type}`);

    try {
      switch (msg.type) {
        case "ready":
          logger.debug("Webview ready → sending dates");
          await this.sendDates();
          return;

        case "pull":
          await this.runWithBusy("ptune-task.pull");
          return;

        case "push":
          // 既存実装では sync コマンドを利用
          await this.runWithBusy("ptune-task.sync");
          return;

        case "review":
          await this.runWithBusy("ptune-task.review");
          return;

        case "auth":
          // Auth は busy 不要（UI凍結回避）
          await this.deps.executeCommand("ptune-task.login");
          return;

        case "request-refresh":
          logger.debug("Webview requested refresh");
          await this.sendDates();
          return;

        case "open-date": {
          logger.info(`Open date requested: ${msg.date}`);

          const result = await this.deps.createDailyNote.execute(msg.date);

          if (result.created) {
            logger.info(`Created new daily note: ${result.note.fileName()}`);
            vscode.window.showInformationMessage(
              `Created: ${result.note.fileName()}`,
            );
          } else {
            logger.debug("Daily note already existed");
          }

          await vscode.window.showTextDocument(
            vscode.Uri.file(result.note.filePath),
          );

          logger.debug("Text document opened");

          await this.sendDates();
          return;
        }
      }
    } catch (error) {
      logger.error("CalendarMessageRouter.handle failed", error);
      throw error;
    }
  }

  /**
   * Pull / Push / Review 共通 busy ラッパー
   */
  private async runWithBusy(command: string): Promise<void> {
    const logger = Logger.get();
    logger.debug(`runWithBusy start: ${command}`);

    await this.deps.postToWebview({ type: "busy", value: true });

    try {
      await this.deps.executeCommand(command);
    } finally {
      await this.deps.postToWebview({ type: "busy", value: false });
      logger.debug(`runWithBusy end: ${command}`);
    }
  }

  async sendDates(): Promise<void> {
    const logger = Logger.get();
    logger.debug("sendDates started");

    try {
      const dates = await this.deps.repository.listExistingDates();
      const today = this.deps.nowISODate();

      logger.debug(`sendDates → ${dates.length} dates, today=${today}`);

      await this.deps.postToWebview({
        type: "update-dates",
        dates,
        today,
      });

      logger.debug("update-dates message sent to webview");
    } catch (error) {
      logger.error("CalendarMessageRouter.sendDates failed", error);
      throw error;
    }
  }
}