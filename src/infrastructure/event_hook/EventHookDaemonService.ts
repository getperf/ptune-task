import { spawn } from "child_process";
import { mkdir, readFile, stat } from "fs/promises";
import { homedir } from "os";
import { dirname, join } from "path";
import { config } from "../../config/config";
import { logger } from "../../shared/logger/loggerInstance";

interface DaemonLockEnvelope {
	updated_at_epoch?: number;
}

export type DaemonControlCommand = "status" | "start" | "stop" | "restart";

export type DaemonState = "running" | "stopped" | "unknown";

export interface DaemonStatusResult {
	state: DaemonState;
	pid: number | null;
	reason: string;
	ageSeconds: number | null;
}

export interface DaemonControlResult {
	ok: boolean;
	code: number | null;
	stdout: string;
	stderr: string;
}

export class EventHookDaemonService {
	async ensureDaemonOnStartup(): Promise<boolean> {
		if (!config.settings.eventHook.enabled) {
			return true;
		}
		return this.ensureDaemonRunning("startup");
	}

	async getDaemonStatus(): Promise<DaemonStatusResult> {
		const result = await this.runDaemonControlCommand("status", ["--json"]);
		if (!result.ok) {
			const reason = this.coalesceErrorMessage(result);
			logger.warn(
				`[EventHook] daemon status failed reason=${reason} code=${result.code}`,
			);
			return {
				state: "unknown",
				pid: null,
				reason,
				ageSeconds: null,
			};
		}

		try {
			const parsed = JSON.parse(result.stdout) as Record<string, unknown>;
			const running = parsed.status === "running";
			const pid = this.toIntOrNull(parsed.pid);
			const reason = this.toStringOrEmpty(parsed.reason) || (running ? "running" : "stopped");
			const ageSeconds = this.toIntOrNull(parsed.age_seconds);
			return {
				state: running ? "running" : "stopped",
				pid,
				reason,
				ageSeconds,
			};
		} catch (error) {
			logger.warn("[EventHook] daemon status output parse failed", error);
			return {
				state: "unknown",
				pid: null,
				reason: "invalid_status_output",
				ageSeconds: null,
			};
		}
	}

	async startDaemon(): Promise<DaemonControlResult> {
		return this.runDaemonControlCommand("start", ["--open-ui"]);
	}

	async stopDaemon(): Promise<DaemonControlResult> {
		return this.runDaemonControlCommand("stop");
	}

	async restartDaemon(): Promise<DaemonControlResult> {
		return this.runDaemonControlCommand("restart", ["--open-ui"]);
	}

	resolveInteropRoot(): string {
		const configured = config.settings.eventHook.interopRoot.trim();
		if (configured) {
			return configured;
		}
		return join(homedir(), ".ptune", "interop");
	}

	resolveLockFilePath(): string {
		return join(dirname(this.resolveInteropRoot()), "runtime", "daemon.lock");
	}

	resolveLockFreshSeconds(): number {
		const value = config.settings.eventHook.lockFreshSeconds;
		if (!Number.isFinite(value)) {
			return 20;
		}
		const rounded = Math.floor(value);
		return Math.max(3, rounded);
	}

	async ensureDaemonRunning(trigger: "startup" | "event"): Promise<boolean> {
		const interopRoot = this.resolveInteropRoot();
		const lockPath = this.resolveLockFilePath();
		const freshSeconds = this.resolveLockFreshSeconds();

		if (await this.isDaemonLockFresh(lockPath, freshSeconds)) {
			return true;
		}
		// The new daemon lock stores a PID and is not a heartbeat. Once its mtime
		// ages past the fast-path window, the CLI status is authoritative.
		const currentStatus = await this.getDaemonStatus();
		if (currentStatus.state === "running") {
			logger.info(
				`[EventHook] daemon ensured by status trigger=${trigger} pid=${currentStatus.pid} lockPath=${lockPath}`,
			);
			return true;
		}

		try {
			await mkdir(interopRoot, { recursive: true });
		} catch (error) {
			logger.warn(
				`[EventHook] daemon interop root prepare failed trigger=${trigger} interopRoot=${interopRoot}`,
				error,
			);
			return false;
		}
		logger.info(
			`[EventHook] ensure daemon trigger=${trigger} interopRoot=${interopRoot} lockPath=${lockPath}`,
		);
		// Startup/event ensure must remain quiet; only explicit settings actions
		// open the dedicated ptune-log window.
		const startResult = await this.runDaemonControlCommand("start", [
			"--no-open-ui",
		]);
		if (!startResult.ok) {
			// Another startup path can win after the preflight status check. Treat
			// that race as success when the authoritative status is now running.
			const recoveredStatus = await this.getDaemonStatus();
			if (recoveredStatus.state === "running") {
				logger.info(
					`[EventHook] daemon start race recovered trigger=${trigger} pid=${recoveredStatus.pid}`,
				);
				return true;
			}
			logger.warn(
				`[EventHook] daemon start failed trigger=${trigger} code=${startResult.code} reason=${this.coalesceErrorMessage(startResult)}`,
			);
			return false;
		}

		const deadline = Date.now() + 5000;
		while (Date.now() < deadline) {
			if (await this.isDaemonLockFresh(lockPath, freshSeconds)) {
				logger.info(
					`[EventHook] daemon ensured trigger=${trigger} lockPath=${lockPath}`,
				);
				return true;
			}
			await this.delay(250);
		}
		logger.warn(
			`[EventHook] daemon start timeout trigger=${trigger} interopRoot=${interopRoot} lockPath=${lockPath} freshSeconds=${freshSeconds}`,
		);
		return false;
	}

	private resolvePythonExePath(): string {
		const configured = config.settings.eventHook.pythonExePath.trim();
		return configured || "python";
	}

	private async runDaemonControlCommand(
		command: DaemonControlCommand,
		extraArgs: string[] = [],
	): Promise<DaemonControlResult> {
		const pythonPath = this.resolvePythonExePath();
		const interopRoot = this.resolveInteropRoot();
		try {
			await mkdir(interopRoot, { recursive: true });
		} catch (error) {
			const message = String(error);
			logger.warn(
				`[EventHook] daemon control prepare failed command=${command} interopRoot=${interopRoot}`,
				error,
			);
			return {
				ok: false,
				code: null,
				stdout: "",
				stderr: message,
			};
		}
		const args = buildDaemonControlArgs(command, extraArgs);
		logger.info(
			`[EventHook] daemon control command=${command} python=${pythonPath} args=${JSON.stringify(args)} interopRoot=${interopRoot}`,
		);

		return new Promise<DaemonControlResult>((resolve) => {
			const child = spawn(pythonPath, args, {
				windowsHide: true,
				cwd: interopRoot,
			});
			let stdout = "";
			let stderr = "";

			child.stdout?.on("data", (chunk: Buffer | string) => {
				stdout += chunk.toString();
			});
			child.stderr?.on("data", (chunk: Buffer | string) => {
				stderr += chunk.toString();
			});
			child.on("error", (error) => {
				const result = {
					ok: false,
					code: null,
					stdout: stdout.trim(),
					stderr: `${stderr}\n${String(error)}`.trim(),
				};
				logger.warn(
					`[EventHook] daemon control failed command=${command} code=null reason=${this.coalesceErrorMessage(result)}`,
				);
				this.logDaemonControlFailureDetails(command, result);
				resolve(result);
			});
			child.on("close", (code) => {
				const result = {
					ok: code === 0,
					code,
					stdout: stdout.trim(),
					stderr: stderr.trim(),
				};
				if (!result.ok) {
					logger.warn(
						`[EventHook] daemon control failed command=${command} code=${code} reason=${this.coalesceErrorMessage(result)}`,
					);
					this.logDaemonControlFailureDetails(command, result);
				}
				resolve(result);
			});
		});
	}

	private logDaemonControlFailureDetails(
		command: DaemonControlCommand,
		result: DaemonControlResult,
	): void {
		const stderr = this.normalizeLogBlock(result.stderr);
		if (stderr) {
			logger.warn(
				`[EventHook] daemon control stderr command=${command} code=${result.code}\n${stderr}`,
			);
		}
		const stdout = this.normalizeLogBlock(result.stdout);
		if (stdout) {
			logger.warn(
				`[EventHook] daemon control stdout command=${command} code=${result.code}\n${stdout}`,
			);
		}
	}

	private normalizeLogBlock(value: string): string {
		return value
			.replace(/\r\n/g, "\n")
			.replace(/\r/g, "\n")
			.trim();
	}

	private coalesceErrorMessage(result: DaemonControlResult): string {
		const stderr = result.stderr.trim();
		if (stderr) {
			return stderr.split("\n")[0] ?? "daemon_status_failed";
		}
		const stdout = result.stdout.trim();
		if (stdout) {
			return stdout.split("\n")[0] ?? "daemon_status_failed";
		}
		return "daemon_status_failed";
	}

	private async isDaemonLockFresh(lockPath: string, freshSeconds: number): Promise<boolean> {
		try {
			const raw = await readFile(lockPath, "utf-8");
			const payload = JSON.parse(raw) as DaemonLockEnvelope;
			if (typeof payload.updated_at_epoch === "number") {
				return Date.now() - payload.updated_at_epoch * 1000 <= freshSeconds * 1000;
			}
		} catch {
			// Fallback to mtime check.
		}
		try {
			const fileStat = await stat(lockPath);
			return Date.now() - fileStat.mtimeMs <= freshSeconds * 1000;
		} catch {
			return false;
		}
	}

	private toIntOrNull(value: unknown): number | null {
		if (typeof value === "number" && Number.isFinite(value)) {
			return Math.trunc(value);
		}
		if (typeof value === "string" && value.trim().length > 0) {
			const parsed = Number.parseInt(value, 10);
			if (!Number.isNaN(parsed)) {
				return parsed;
			}
		}
		return null;
	}

	private toStringOrEmpty(value: unknown): string {
		return typeof value === "string" ? value : "";
	}

	private async delay(ms: number): Promise<void> {
		await new Promise<void>((resolve) => window.setTimeout(resolve, ms));
	}
}

export function buildDaemonControlArgs(
	command: DaemonControlCommand,
	extraArgs: string[] = [],
): string[] {
	return ["-m", "ptune_log.main", "daemon", command, ...extraArgs];
}
