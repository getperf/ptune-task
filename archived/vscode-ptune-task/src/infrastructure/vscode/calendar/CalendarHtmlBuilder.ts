// src/webview/calendar/CalendarHtmlBuilder.ts
import * as vscode from "vscode";

export class CalendarHtmlBuilder {
  async build(
    webview: vscode.Webview,
    mediaRoot: vscode.Uri,
  ): Promise<string> {
    const htmlUri = vscode.Uri.joinPath(mediaRoot, "index.html");
    const htmlBytes = await vscode.workspace.fs.readFile(htmlUri);
    let html = Buffer.from(htmlBytes).toString("utf8");

    const nonce = createNonce();
    const baseUri = webview.asWebviewUri(mediaRoot);
    const cspSource = webview.cspSource;

    html = html
      .replace(/\{\{BASE_URI\}\}/g, baseUri.toString())
      .replace(/\{\{CSP_SOURCE\}\}/g, cspSource)
      .replace(/\{\{NONCE\}\}/g, nonce);

    return html;
  }
}

function createNonce(): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return Array.from(
    { length: 32 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("");
}
