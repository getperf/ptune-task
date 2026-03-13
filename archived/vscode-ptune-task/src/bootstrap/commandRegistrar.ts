import * as vscode from "vscode";
import { Container } from "./container";
import { registerPullCommand } from "../infrastructure/vscode/commands/pullCommand";
import { registerAuthLoginCommand } from "../infrastructure/vscode/commands/authLoginCommand";
import { registerAuthStatusCommand } from "../infrastructure/vscode/commands/authStatusCommand";
import { registerSyncCommand } from "../infrastructure/vscode/commands/syncCommand";
import { registerReviewCommand } from "../infrastructure/vscode/commands/reviewCommand";

export function registerAllCommands(
  context: vscode.ExtensionContext,
  container: Container,
): void {
  registerPullCommand(context, container.createPullTodayCommand());
  registerSyncCommand(context, container.createSyncAndRebuildCommand());
  registerReviewCommand(context, container.createReviewCommand());
  registerAuthLoginCommand(context, container.createAuthService());
  registerAuthStatusCommand(context, container.createAuthService());
}
