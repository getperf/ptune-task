// src/infrastructure/sync/ptune-sync/CliEnvelopeParser.ts

import { CliEnvelope } from "./CliEnvelope";
import { PtuneSyncContractError } from "./PtuneSyncError";
import { Logger } from "../../../shared/logger/Logger";

export class CliEnvelopeParser {
  /**
   * 既存互換: data を返す
   */
  static parse<T>(raw: unknown): T {
    const env = this.parseEnvelope<T>(raw);

    if (env.data === undefined) {
      throw new PtuneSyncContractError("Missing data field [CEP:MISS_DATA]");
    }

    return env.data;
  }

  /**
   * 新規: envelope 全体を返す（diff 用）
   */
  static parseEnvelope<T>(raw: unknown): CliEnvelope<T> {
    const logger = Logger.get();

    logger.debug(
      `[CliEnvelopeParser] parseEnvelope entered. typeof(raw)=${typeof raw}`,
    );

    let obj: unknown = raw;

    if (typeof raw === "string") {
      try {
        obj = JSON.parse(raw);
      } catch (e) {
        logger.error("[CliEnvelopeParser] JSON.parse failed", e);
        throw new PtuneSyncContractError(
          "Invalid JSON from CLI [CEP:JSON_PARSE]",
        );
      }
    }

    if (!obj || typeof obj !== "object") {
      throw new PtuneSyncContractError(
        "Invalid CLI response structure [CEP:NOT_OBJECT]",
      );
    }

    const envelope = obj as CliEnvelope<T>;

    if (typeof envelope.success !== "boolean") {
      throw new PtuneSyncContractError(
        "Missing success field [CEP:MISS_SUCCESS]",
      );
    }

    // 🔹 data はここでは必須にしない（diff対応）

    return envelope;
  }
}
