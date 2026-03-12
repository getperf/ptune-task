// src/infrastructure/sync/ptune-sync/PtuneSyncAuthService.ts

import { CliEnvelopeParser } from "./CliEnvelopeParser";
import { PtuneSyncClient } from "./PtuneSyncClient";
import { logger } from "../../../shared/logger/loggerInstance";

type AuthData = {
  auth: {
    authenticated: boolean;
    email: string | null;
    expires_at: string;
  };
};

export class PtuneSyncAuthService {
  constructor(private readonly client: PtuneSyncClient) {}

  async status(): Promise<{ authenticated: boolean; email: string | null }> {
    logger.info("Auth status started");

    const raw = await this.client.run(["auth", "status"]);
    logger.debug(`Auth status raw: ${raw}`);

    // ★ parse は data を返す
    const data = CliEnvelopeParser.parse<AuthData>(raw);

    if (!data?.auth) {
      throw new Error("Invalid auth response structure");
    }

    return {
      authenticated: data.auth.authenticated,
      email: data.auth.email ?? null,
    };
  }

  async login(): Promise<void> {
    logger.info("Auth login started");

    const raw = await this.client.run(["auth", "login"]);
    logger.debug(`Auth login raw: ${raw}`);

    const data = CliEnvelopeParser.parse<AuthData>(raw);

    if (!data?.auth?.authenticated) {
      throw new Error("Login did not complete successfully");
    }

    logger.info("Auth login succeeded");
  }
}
