import * as vscode from "vscode";
import { i18n } from "./shared/i18n/I18n";
import { Container } from "./bootstrap/container";
import { CalendarModule } from "./bootstrap/CalendarModule";
import { registerAllCommands } from "./bootstrap/commandRegistrar";
import { Logger, LogLevel } from "./shared/logger/Logger";
import { registerTaskCompletion } from "./bootstrap/registerTaskCompletion";
import { registerTaskLineValidation } from "./bootstrap/registerTaskLineValidation";

export function activate(context: vscode.ExtensionContext) {
  i18n.init();
  const config = vscode.workspace.getConfiguration("ptune-task");
  const level = config.get<LogLevel>("logLevel", "info");

  Logger.initialize({ level });

  const logger = Logger.get();
  logger.info(`Extension activated ${level}`);
  logger.debug("Debug");

  const container = new Container(context);

  const calendarModule = new CalendarModule(container);
  calendarModule.register(context);

  registerAllCommands(context, container);
  registerTaskCompletion(context);
  // registerTaskLineValidation(context);

  vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration("ptune-task.logLevel")) {
      const newLevel = vscode.workspace
        .getConfiguration("ptune-task")
        .get<LogLevel>("logLevel", "info");

      logger.updateLevel(newLevel);
    }
  });
}

export function deactivate() {}
