// src/infrastructure/sync/ptune-sync/PtuneSyncCliAdapter.ts

import { PtuneSyncPort } from "../../../application/sync/shared/ports/PtuneSyncPort";
import { PullQuery } from "../../../application/sync/shared/dto/PullQuery";
import { PushQuery } from "../../../application/sync/shared/dto/PushQuery";
import { PtuneSyncClient } from "./PtuneSyncClient";
import { CliEnvelopeParser } from "./CliEnvelopeParser";
import { PtuneSyncContractError } from "./PtuneSyncError";
import { Logger } from "../../../shared/logger/Logger";
import {
  DiffData,
  DiffResult,
} from "../../../application/sync/shared/dto/DiffResult";
import { ReviewQuery } from "../../../application/sync/shared/dto/ReviewQuery";

type ExportLikeResult = {
  schema_version: number;
  list: string;
  exported_at: string;
  tasks: unknown[];
};

export class PtuneSyncCliAdapter implements PtuneSyncPort {
  private readonly logger = Logger.get();

  constructor(private readonly client: PtuneSyncClient) { }

  async pull(query: PullQuery): Promise<string> {
    const args = ["pull", "--list", query.list];

    if (query.includeCompleted) {
      args.push("--include-completed");
    }

    const data = await this.runExportCommand(args);

    // application層にJSON文字列を返す（既存互換）
    return JSON.stringify(data);
  }

  async review(query: ReviewQuery): Promise<string> {
    const args = ["review", "--list", query.list];

    const data = await this.runExportCommand(args);

    // pull と同じフォーマット（既存の共通化方針に合わせる）
    return JSON.stringify(data);
  }

  async diff(payload: string): Promise<DiffResult> {
    const raw = await this.client.run(["diff"], payload);

    // 🔹 T は data の中身
    const envelope = CliEnvelopeParser.parseEnvelope<DiffData>(raw);

    const summary = envelope.data?.summary ?? {
      create: 0,
      update: 0,
      delete: 0,
      errors: 0,
      warnings: 0,
    };

    const errors = envelope.data?.errors ?? [];
    const warnings = envelope.data?.warnings ?? [];

    return new DiffResult(
      envelope.success,
      summary,
      errors,
      warnings,
      envelope.error?.message,
    );
  }

  async push(payload: string, query: PushQuery): Promise<void> {
    const args = ["push", "--list", query.list];

    if (query.allowDelete) {
      args.push("--allow-delete");
    }

    this.logger.info(
      `PtuneSyncCliAdapter.push: ${args.join(" ")}`,
    );

    await this.client.run(args, payload);
  }

  // =========================================================
  // Export系コマンド（pull/review など）の共通処理
  // =========================================================
  private async runExportCommand(args: string[]): Promise<ExportLikeResult> {
    this.logger.info(`PtuneSyncCliAdapter.runExportCommand: ${args.join(" ")}`);

    const raw = await this.client.run(args);

    const data = CliEnvelopeParser.parse<ExportLikeResult>(raw);

    this.assertSchemaVersion(data.schema_version);

    // ここで data の最低限の形も守る（壊れたCLI出力対策）
    if (!Array.isArray(data.tasks)) {
      throw new PtuneSyncContractError("Invalid tasks: expected array");
    }
    if (typeof data.list !== "string" || typeof data.exported_at !== "string") {
      throw new PtuneSyncContractError("Invalid export result fields");
    }

    return data;
  }

  private assertSchemaVersion(schemaVersion: number): void {
    if (schemaVersion !== 2) {
      throw new PtuneSyncContractError(
        `Unsupported schema_version: ${schemaVersion}`,
      );
    }
  }
}
