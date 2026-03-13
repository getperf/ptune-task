// src/infrastructure/sync/ptune-sync/mock/MockPtuneSyncClient.ts

import * as vscode from "vscode";
import { PullQuery } from "../../../../application/sync/shared/dto/PullQuery";
import { PtuneSyncPort } from "../../../../application/sync/shared/ports/PtuneSyncPort";
import { DiffResult } from "../../../../application/sync/shared/dto/DiffResult";
import { CliEnvelopeParser } from "../CliEnvelopeParser";

type DiffEnvelope = {
  version: number;
  success: boolean;
  error?: { type: string; message: string };
  command: string;
  data?: {
    summary: {
      create: number;
      update: number;
      delete: number;
      errors: number;
      warnings: number;
    };
    errors: string[];
    warnings: string[];
  };
};

export class MockPtuneSyncClient implements PtuneSyncPort {
  constructor(private readonly context: vscode.ExtensionContext) {}

  async pull(params: PullQuery): Promise<string> {
    const fileName = params.date ? `${params.date}.json` : "2026-02-13.json";

    const fileUri = vscode.Uri.joinPath(
      this.context.extensionUri,
      "samples",
      params.list,
      fileName,
    );

    const content = await vscode.workspace.fs.readFile(fileUri);
    const json = Buffer.from(content).toString("utf-8");

    console.log("[MockPtuneSyncClient] loaded:", fileUri.fsPath);

    return json;
  }

  async review(params: PullQuery): Promise<string> {
    return this.pull(params);
  }

  async diff(payload: string): Promise<DiffResult> {
    console.log("MOCK DIFF PAYLOAD:");
    console.log(payload);

    const fileUri = vscode.Uri.joinPath(
      this.context.extensionUri,
      "samples",
      "diff_response.json",
    );

    const content = await vscode.workspace.fs.readFile(fileUri);
    const raw = Buffer.from(content).toString("utf-8");

    const envelope = CliEnvelopeParser.parse<DiffEnvelope>(raw);

    const data = envelope.data;

    return new DiffResult(
      envelope.success,
      data?.summary ?? {
        create: 0,
        update: 0,
        delete: 0,
        errors: 0,
        warnings: 0,
      },
      data?.errors ?? [],
      data?.warnings ?? [],
      envelope.error?.message,
    );
  }

  async push(payload: string): Promise<void> {
    console.log("MOCK PUSH JSON:");
    console.log(payload);
  }
}
