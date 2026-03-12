// src/infrastructure/sync/ptune-sync/PtuneSyncClient.ts

import { ProcessRunner } from "../../process/ProcessRunner";

export class PtuneSyncClient {
  constructor(
    private readonly runner: ProcessRunner,
    private readonly baseCommand: string = "uv",
  ) {}

  async run(args: string[], stdin?: string): Promise<string> {
    const fullArgs = ["run", "ptune-sync", ...args];

    const result = await this.runner.run(this.baseCommand, fullArgs, stdin);

    // 🔹 stdoutがあれば優先
    if (result.stdout && result.stdout.trim().length > 0) {
      return result.stdout;
    }

    // 🔹 stdoutが無く、exitCodeも非0なら実行失敗
    if (result.exitCode !== 0) {
      throw new Error(result.stderr || "ptune-sync execution failed");
    }

    // 🔹 何も返らない異常ケース
    throw new Error("ptune-sync returned no output");
  }
}
