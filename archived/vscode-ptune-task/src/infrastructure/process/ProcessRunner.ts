// src/infrastructure/process/ProcessRunner.ts

import { spawn } from "child_process";

export interface ProcessResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export class ProcessRunner {
  async run(
    command: string,
    args: string[],
    stdin?: string,
  ): Promise<ProcessResult> {
    return new Promise((resolve, reject) => {
      const child = spawn(command, args, {
        shell: false,
        env: {
          ...process.env,
          PYTHONIOENCODING: "utf-8", // 🔥 これが重要
        },
      });

      let stdout = "";
      let stderr = "";

      child.stdout.setEncoding("utf8");
      child.stderr.setEncoding("utf8");

      child.stdout.on("data", (data) => {
        stdout += data;
      });

      child.stderr.on("data", (data) => {
        stderr += data;
      });

      child.on("close", (code) => {
        resolve({
          stdout,
          stderr,
          exitCode: code ?? 1,
        });
      });

      child.on("error", reject);

      if (stdin) {
        child.stdin.write(stdin);
        child.stdin.end();
      }
    });
  }
}