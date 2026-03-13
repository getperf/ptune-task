// src/infrastructure/vscode/calendar/messages.ts

export type WebviewToExtensionMessage =
  | { type: "ready" }
  | { type: "open-date"; date: string }
  | { type: "request-refresh" }
  | { type: "pull" }
  | { type: "push" }
  | { type: "review" }
  | { type: "auth" };

export type ExtensionToWebviewMessage =
  | { type: "update-dates"; dates: string[]; today: string }
  | { type: "error"; message: string }
  | { type: "busy"; value: boolean };

export function isWebviewToExtensionMessage(
  v: unknown,
): v is WebviewToExtensionMessage {
  if (!v || typeof v !== "object") {
    return false;
  }
  const t = (v as any).type;
  if (typeof t !== "string") {
    return false;
  }

  if (t === "ready") {
    return true;
  }
  if (t === "request-refresh") {
    return true;
  }
  if (t === "pull") {
    return true;
  }
  if (t === "push") {
    return true;
  }
  if (t === "review") {
    return true;
  }
  if (t === "auth") {
    return true;
  }

  if (t === "open-date") {
    return typeof (v as any).date === "string";
  }

  return false;
}
