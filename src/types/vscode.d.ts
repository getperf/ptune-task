declare module "vscode" {
  export interface Disposable {
    dispose(): void;
  }

  export interface Position {
    line: number;
  }

  export interface Range {
    start: Position;
  }

  export interface TextLine {
    text: string;
  }

  export interface TextDocument {
    languageId: string;
    lineAt(line: number): TextLine;
  }

  export interface TextDocumentContentChangeEvent {
    range: Range;
  }

  export interface TextDocumentChangeEvent {
    document: TextDocument;
    contentChanges: TextDocumentContentChangeEvent[];
  }

  export interface ExtensionContext {
    subscriptions: Disposable[];
  }

  export const workspace: {
    onDidChangeTextDocument(
      listener: (event: TextDocumentChangeEvent) => void,
    ): Disposable;
  };

  export const window: {
    showWarningMessage(message: string): void;
  };
}
