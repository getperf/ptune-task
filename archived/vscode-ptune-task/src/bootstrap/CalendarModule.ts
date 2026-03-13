import * as vscode from "vscode";
import { Container } from "./container";
import { CalendarViewProvider } from "../infrastructure/vscode/calendar/CalendarViewProvider";

export class CalendarModule {
  constructor(
    private readonly container: Container,
  ) { }

  register(context: vscode.ExtensionContext): void {
    const provider = this.container.createCalendarViewProvider();

    context.subscriptions.push(
      vscode.window.registerWebviewViewProvider(
        CalendarViewProvider.viewType,
        provider,
      ),
    );
  }
}