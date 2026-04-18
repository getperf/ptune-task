import { App } from "obsidian";
import { homedir } from "os";
import { dirname, join } from "path";
import { mkdir, readFile, rename, stat, writeFile } from "fs/promises";
import { spawn } from "child_process";
import { config } from "../../config/config";
import { logger } from "../../shared/logger/loggerInstance";

type EventType =
	| "note-create"
	| "note-work-finished"
	| "note-attached"
	| "note-review-requested";
type HookStatus = "success" | "skipped" | "error" | "timeout";
type PythonStatus = "success" | "skipped" | "error";

interface ReviewRequestPayload {
	profiles_file: string;
	credentials_file: string;
	profile_id: string;
}

interface EventEnvelope {
	schema_version: 1;
	request_id: string;
	event_type: EventType;
	note_path: string;
	vault_path: string;
	created_at: string;
	payload?: ReviewRequestPayload;
}

interface StatusEnvelope {
	schema_version: number;
	request_id: string;
	status: PythonStatus;
	message?: string;
	updated_at?: string;
}

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

export interface EventHookEmitResult {
	requestId: string;
	status: HookStatus;
	message: string;
}

export interface EventHookEmitOptions {
	enabledOverride?: boolean;
}

export class EventHookService {
	constructor(private readonly app: App) {}

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
			return {
				state: "unknown",
				pid: null,
				reason: this.coalesceErrorMessage(result),
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
		} catch {
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

	async emitNoteCreate(
		notePath: string,
		options?: EventHookEmitOptions,
	): Promise<EventHookEmitResult> {
		return this.emit("note-create", notePath, options);
	}

	async emitNoteWorkFinished(
		notePath: string,
		options?: EventHookEmitOptions,
	): Promise<EventHookEmitResult> {
		return this.emit("note-work-finished", notePath, options);
	}

	async emitNoteAttached(
		notePath: string,
		options?: EventHookEmitOptions,
	): Promise<EventHookEmitResult> {
		return this.emit("note-attached", notePath, options);
	}

	async emitNoteReviewRequested(
		notePath: string,
		payload: ReviewRequestPayload,
		options?: EventHookEmitOptions,
	): Promise<EventHookEmitResult> {
		return this.emit("note-review-requested", notePath, options, payload);
	}

	private async emit(
		eventType: EventType,
		notePath: string,
		options?: EventHookEmitOptions,
		payload?: ReviewRequestPayload,
	): Promise<EventHookEmitResult> {
		const hookEnabled =
			options?.enabledOverride ?? config.settings.eventHook.enabled;
		if (!hookEnabled) {
			return {
				requestId: "",
				status: "skipped",
				message: "event-hook is disabled",
			};
		}

		const vaultPath = this.resolveVaultPath();
		if (!vaultPath) {
			return {
				requestId: "",
				status: "error",
				message: "vault path could not be resolved",
			};
		}

		const requestId = this.generateRequestId();
		const createdAt = new Date().toISOString();
		const event: EventEnvelope = {
			schema_version: 1,
			request_id: requestId,
			event_type: eventType,
			note_path: notePath,
			vault_path: vaultPath,
			created_at: createdAt,
			payload,
		};

		const interopRoot = this.resolveInteropRoot();
		if (config.settings.eventHook.ensureOnEvent) {
			const ensured = await this.ensureDaemonRunning("event");
			if (!ensured) {
				logger.warn(
					"[EventHook] ensure on event failed but continuing to emit event and wait for status",
				);
			}
		}
		const inboxPath = join(
			interopRoot,
			"interop",
			"events",
			"inbox",
			`${requestId}.json`,
		);
		const statusPath = join(
			interopRoot,
			"interop",
			"status",
			`${requestId}.json`,
		);

		await this.writeJsonAtomic(inboxPath, event);
		logger.info(
			`[EventHook] emitted eventType=${eventType} requestId=${requestId} note=${notePath}`,
		);

		const timeoutMs = this.resolveStatusWaitMs();
		const status = await this.waitForStatus(statusPath, timeoutMs);
		if (!status) {
			return {
				requestId,
				status: "timeout",
				message:
					"codex-md-export daemon is not running or not responding",
			};
		}

		return {
			requestId,
			status: status.status,
			message: status.message ?? `${status.status}`,
		};
	}

	private resolveStatusWaitMs(): number {
		const value = config.settings.eventHook.statusWaitMs;
		if (!Number.isFinite(value)) {
			return 2500;
		}
		const rounded = Math.floor(value);
		return Math.max(300, rounded);
	}

	private resolveLockFreshSeconds(): number {
		const value = config.settings.eventHook.lockFreshSeconds;
		if (!Number.isFinite(value)) {
			return 20;
		}
		const rounded = Math.floor(value);
		return Math.max(3, rounded);
	}

	private resolveDaemonArgs(interopRoot: string): string[] {
		const configured = config.settings.eventHook.daemonArgs.trim();
		const base = configured
			? this.splitArgs(configured)
			: ["-m", "codex_md_export.main", "daemon", "--debug"];
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

	private resolveInteropRoot(): string {
		const configured = config.settings.eventHook.interopRoot.trim();
		if (configured) {
			return configured;
		}
		return join(homedir(), ".codex-md-export");
	}

	private resolveLockFilePath(): string {
		return join(this.resolveInteropRoot(), "runtime", "locks", "daemon.lock");
	}

	private resolveVaultPath(): string | null {
		const adapter = this.app.vault.adapter as unknown as {
			getBasePath?: () => string;
		};
		if (typeof adapter.getBasePath !== "function") {
			return null;
		}
		return adapter.getBasePath();
	}

	private async waitForStatus(
		path: string,
		timeoutMs: number,
	): Promise<StatusEnvelope | null> {
		const deadline = Date.now() + timeoutMs;
		while (Date.now() < deadline) {
			try {
				const raw = await readFile(path, "utf-8");
				const parsed = JSON.parse(raw) as StatusEnvelope;
				if (parsed && parsed.request_id && parsed.status) {
					return parsed;
				}
			} catch {
				// continue polling
			}
			await this.delay(200);
		}
		return null;
	}

	private async writeJsonAtomic(
		path: string,
		payload: unknown,
	): Promise<void> {
		await mkdir(dirname(path), { recursive: true });
		const tmpPath = `${path}.tmp`;
		await writeFile(
			tmpPath,
			`${JSON.stringify(payload, null, 2)}\n`,
			"utf-8",
		);
		await rename(tmpPath, path);
	}

	private generateRequestId(): string {
		const iso = new Date()
			.toISOString()
			.replace(/[-:]/g, "")
			.replace(/\.\d{3}Z$/, "Z");
		const suffix = Math.random().toString(16).slice(2, 4).padEnd(2, "0");
		return `${iso}-${suffix}`;
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

	private async ensureDaemonRunning(trigger: "startup" | "event"): Promise<boolean> {
		const interopRoot = this.resolveInteropRoot();
		const lockPath = this.resolveLockFilePath();
		const freshSeconds = this.resolveLockFreshSeconds();

		if (await this.isDaemonLockFresh(lockPath, freshSeconds)) {
			return true;
		}

		const pythonPath = await this.resolvePythonCommandForDaemon();
		const daemonArgs = this.resolveDaemonArgs(interopRoot);
		logger.info(
			`[EventHook] ensure daemon trigger=${trigger} python=${pythonPath} args=${JSON.stringify(daemonArgs)}`,
		);
		try {
			const child = spawn(pythonPath, daemonArgs, {
				detached: true,
				stdio: "ignore",
				windowsHide: true,
				cwd: interopRoot,
			});
			child.unref();
		} catch (error) {
			logger.warn("[EventHook] daemon start failed", error);
			return false;
		}

		const deadline = Date.now() + 5000;
		while (Date.now() < deadline) {
			if (await this.isDaemonLockFresh(lockPath, freshSeconds)) {
				return true;
			}
			await this.delay(250);
		}
		return false;
	}

	private async runDaemonControlCommand(
		command: DaemonControlCommand,
		extraArgs: string[] = [],
	): Promise<DaemonControlResult> {
		const pythonPath = await this.resolvePythonCommandForDaemon();
		const interopRoot = this.resolveInteropRoot();
		const args = [
			"-m",
			"codex_md_export.main",
			"daemon",
			command,
			"--interop-root",
			interopRoot,
			...extraArgs,
		];
		logger.info(
			`[EventHook] daemon control command=${command} python=${pythonPath} args=${JSON.stringify(args)}`,
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
				resolve({
					ok: false,
					code: null,
					stdout: stdout.trim(),
					stderr: `${stderr}\n${String(error)}`.trim(),
				});
			});
			child.on("close", (code) => {
				resolve({
					ok: code === 0,
					code,
					stdout: stdout.trim(),
					stderr: stderr.trim(),
				});
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

	private async isDaemonLockFresh(lockPath: string, freshSeconds: number): Promise<boolean> {
		try {
			const raw = await readFile(lockPath, "utf-8");
			const payload = JSON.parse(raw) as DaemonLockEnvelope;
			if (typeof payload.updated_at_epoch === "number") {
				return Date.now() - payload.updated_at_epoch * 1000 <= freshSeconds * 1000;
			}
		} catch {
			// Fallback to mtime check
		}
		try {
			const fileStat = await stat(lockPath);
			return Date.now() - fileStat.mtimeMs <= freshSeconds * 1000;
		} catch {
			return false;
		}
	}

	private async delay(ms: number): Promise<void> {
		await new Promise<void>((resolve) => window.setTimeout(resolve, ms));
	}
}
