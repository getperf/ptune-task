import * as vscode from "vscode";
import { CalendarHtmlBuilder } from "./CalendarHtmlBuilder";
import { CalendarMessageRouter } from "./CalendarMessageRouter";
import {
  ExtensionToWebviewMessage,
  isWebviewToExtensionMessage,
  WebviewToExtensionMessage,
} from "./messages";
import { DailyNoteRepository } from "../../repository/DailyNoteRepository";
import { CreateDailyNoteUseCase } from "../../../application/calendar/usecases/CreateDailyNoteUseCase";

function toLocalISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export class CalendarViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "ptune-task.calendarView";

  private view?: vscode.WebviewView;
  private router?: CalendarMessageRouter;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly createDailyNote: CreateDailyNoteUseCase,
    private readonly repository: DailyNoteRepository,
    private readonly htmlBuilder: CalendarHtmlBuilder = new CalendarHtmlBuilder(),
  ) {}

  async resolveWebviewView(view: vscode.WebviewView): Promise<void> {
    this.view = view;
    const webview = view.webview;

    const mediaRoot = vscode.Uri.joinPath(
      this.context.extensionUri,
      "media",
      "calendar",
    );

    webview.options = {
      enableScripts: true,
      localResourceRoots: [mediaRoot],
    };

    this.router = new CalendarMessageRouter({
      createDailyNote: this.createDailyNote,
      repository: this.repository,
      postToWebview: async (msg) => {
        if (!this.view) return;
        await this.view.webview.postMessage(msg);
      },
      nowISODate: () => toLocalISODate(new Date()),
      executeCommand: async (command: string) => {
        await vscode.commands.executeCommand(command);
      },
    });

    webview.onDidReceiveMessage(async (raw: unknown) => {
      await this.onMessage(raw);
    });

    webview.html = await this.htmlBuilder.build(webview, mediaRoot);
  }

  /**
   * 外部（Command）から呼ばれるUI更新用API
   * Webview未初期化時は何もしない
   */
  public async refreshCalendar(): Promise<void> {
    if (!this.router) return;

    try {
      await this.router.sendDates();
    } catch {
      // UI層なので握りつぶす（pull本体に影響させない）
    }
  }

  private async onMessage(raw: unknown): Promise<void> {
    if (!this.router) return;

    if (!isWebviewToExtensionMessage(raw)) {
      console.warn("[ptune-task] invalid message:", raw);
      return;
    }

    const msg = raw as WebviewToExtensionMessage;

    try {
      await this.router.handle(msg);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await this.postToWebview({ type: "error", message });
    }
  }

  private async postToWebview(msg: ExtensionToWebviewMessage): Promise<void> {
    if (!this.view) return;
    await this.view.webview.postMessage(msg);
  }
}
