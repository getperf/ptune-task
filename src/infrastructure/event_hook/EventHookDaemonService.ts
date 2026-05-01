import { spawn } from "child_process";
import { mkdir, readFile, stat } from "fs/promises";
import { homedir } from "os";
import { dirname, join } from "path";
import { config } from "../../config/config";
import { logger } from "../../shared/logger/loggerInstance";

interface DaemonLockEnvelope {
	updated_at_epoch?: number;
}

type DaemonControlCommand = "status" | "start" | "stop" | "restart";

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
		const freshSeconds = this.resolveLockFreshSeconds();
		const result = await this.runDaemonControlCommand("status", [
			"--json",
			"--stale-after-seconds",
			String(freshSeconds),
		]);
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
			const running = parsed.running === true;
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
		return this.runDaemonControlCommand("start");
	}

	async stopDaemon(): Promise<DaemonControlResult> {
		return this.runDaemonControlCommand("stop", [
			"--timeout-seconds",
			"15",
			"--stale-after-seconds",
			String(this.resolveLockFreshSeconds()),
		]);
	}

	async restartDaemon(): Promise<DaemonControlResult> {
		return this.runDaemonControlCommand("restart", [
			"--timeout-seconds",
			"15",
			"--stale-after-seconds",
			String(this.resolveLockFreshSeconds()),
		]);
	}

	resolveInteropRoot(): string {
		const configured = config.settings.eventHook.interopRoot.trim();
		if (configured) {
			return configured;
		}
		return join(homedir(), ".ptune-log");
	}

	resolveLockFilePath(): string {
		return join(this.resolveInteropRoot(), "runtime", "locks", "daemon.lock");
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

		try {
			await mkdir(interopRoot, { recursive: true });
		} catch (error) {
			logger.warn(
				`[EventHook] daemon interop root prepare failed trigger=${trigger} interopRoot=${interopRoot}`,
				error,
			);
			return false;
		}
		const pythonPath = await this.resolvePythonCommandForDaemon();
		const daemonArgs = this.resolveDaemonArgs(interopRoot);
		logger.info(
			`[EventHook] ensure daemon trigger=${trigger} python=${pythonPath} args=${JSON.stringify(daemonArgs)} interopRoot=${interopRoot} lockPath=${lockPath}`,
		);

		let spawnError: Error | null = null;
		try {
			const child = spawn(pythonPath, daemonArgs, {
				detached: true,
				stdio: "ignore",
				windowsHide: true,
				cwd: interopRoot,
			});
			child.once("error", (error) => {
				spawnError = error;
				logger.warn(
					`[EventHook] daemon start failed trigger=${trigger} python=${pythonPath} interopRoot=${interopRoot}`,
					error,
				);
			});
			child.unref();
		} catch (error) {
			logger.warn(
				`[EventHook] daemon start failed trigger=${trigger} python=${pythonPath} interopRoot=${interopRoot}`,
				error,
			);
			return false;
		}

		const deadline = Date.now() + 5000;
		while (Date.now() < deadline) {
			if (spawnError) {
				return false;
			}
			if (await this.isDaemonLockFresh(lockPath, freshSeconds)) {
				logger.info(
					`[EventHook] daemon ensured trigger=${trigger} lockPath=${lockPath}`,
				);
				return true;
			}
			await this.delay(250);
		}
		logger.warn(
			`[EventHook] daemon start timeout trigger=${trigger} python=${pythonPath} args=${JSON.stringify(daemonArgs)} interopRoot=${interopRoot} lockPath=${lockPath} freshSeconds=${freshSeconds}`,
		);
		return false;
	}

	private resolveDaemonArgs(interopRoot: string): string[] {
		const configured = config.settings.eventHook.daemonArgs.trim();
		const base = configured
			? this.splitArgs(configured)
			: ["-m", "ptune_log.main", "daemon", "--debug"];
		if (!base.includes("--interop-root")) {
			base.push("--interop-root", interopRoot);
		}
		return base;
	}

	private resolvePythonExePath(): string {
		const configured = config.settings.eventHook.pythonExePath.trim();
		return configured || "python";
	}

	private async resolvePythonCommandForDaemon(): Promise<string> {
		const configured = this.resolvePythonExePath();
		if (
			process.platform !== "win32" ||
			!configured.toLowerCase().endsWith("python.exe")
		) {
			return configured;
		}
		const pythonwPath = join(dirname(configured), "pythonw.exe");
		try {
			await stat(pythonwPath);
			return pythonwPath;
		} catch {
			return configured;
		}
	}

	private async runDaemonControlCommand(
		command: DaemonControlCommand,
		extraArgs: string[] = [],
	): Promise<DaemonControlResult> {
		const pythonPath = await this.resolvePythonCommandForDaemon();
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
		const args = [
			"-m",
			"ptune_log.main",
			"daemon",
			command,
			"--interop-root",
			interopRoot,
			...extraArgs,
		];
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
				}
				resolve(result);
			});
		});
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

	private splitArgs(value: string): string[] {
		const args: string[] = [];
		const re = /"([^"]*)"|'([^']*)'|(\S+)/g;
		let match: RegExpExecArray | null;
		while ((match = re.exec(value)) !== null) {
			args.push(match[1] ?? match[2] ?? match[3] ?? "");
		}
		return args.filter((v) => v.length > 0);
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
