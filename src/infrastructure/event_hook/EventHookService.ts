import { App } from "obsidian";
import { dirname, join } from "path";
import { homedir } from "os";
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import { config } from "../../config/config";
import { logger } from "../../shared/logger/loggerInstance";
import {
	DaemonControlResult,
	DaemonStatusResult,
	EventHookDaemonService,
} from "./EventHookDaemonService";

export type {
	DaemonControlResult,
	DaemonState,
	DaemonStatusResult,
} from "./EventHookDaemonService";

type EventType =
	| "note-create"
	| "note-attached"
	| "note-review-requested"
	| "daily-review-requested";
type HookStatus = "success" | "skipped" | "error" | "timeout";
type PythonStatus = "success" | "skipped" | "error";

interface ReviewRequestPayload extends Record<string, unknown> {
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
	payload?: Record<string, unknown>;
}

interface StatusEnvelope {
	schema_version: number;
	request_id: string;
	status: PythonStatus;
	message?: string;
	updated_at?: string;
}

interface NotificationEnvelope {
	schema_version?: number;
	event_type?: string;
	request_id?: string;
	created_at?: string;
	payload?: Record<string, unknown>;
}

export interface DailyReviewRequestPayload extends ReviewRequestPayload {
	dailynote_key: string;
	updated_within_days?: number;
	batch_id?: string;
}

export interface DailyReviewAppliedResult {
	requestId: string;
	batchId: string;
	dailynoteKey: string;
	closeReason: string;
	appliedCount: number;
	failedCount: number;
	appliedNotes: string[];
	failedNotes: string[];
}

export interface EventHookEmitResult {
	requestId: string;
	status: HookStatus;
	message: string;
}

export interface EventHookEmitOptions {
	enabledOverride?: boolean;
	payload?: Record<string, unknown>;
}

export class EventHookService {
	constructor(
		private readonly app: App,
		private readonly daemonService = new EventHookDaemonService(),
	) { }

	async ensureDaemonOnStartup(): Promise<boolean> {
		return this.daemonService.ensureDaemonOnStartup();
	}

	async getDaemonStatus(): Promise<DaemonStatusResult> {
		return this.daemonService.getDaemonStatus();
	}

	async startDaemon(): Promise<DaemonControlResult> {
		return this.daemonService.startDaemon();
	}

	async stopDaemon(): Promise<DaemonControlResult> {
		return this.daemonService.stopDaemon();
	}

	async restartDaemon(): Promise<DaemonControlResult> {
		return this.daemonService.restartDaemon();
	}

	async emitNoteCreate(
		notePath: string,
		options?: EventHookEmitOptions,
	): Promise<EventHookEmitResult> {
		return this.emit("note-create", notePath, options);
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

	async emitDailyReviewRequested(
		dailynoteKey: string,
		payload: DailyReviewRequestPayload,
		options?: EventHookEmitOptions,
	): Promise<EventHookEmitResult> {
		return this.emit("daily-review-requested", dailynoteKey, options, payload);
	}

	async waitForDailyReviewApplied(
		batchId: string,
		timeoutMs: number,
	): Promise<DailyReviewAppliedResult | null> {
		const resolvedBatchId = batchId.trim();
		if (!resolvedBatchId) {
			return null;
		}
		const interopRoot = this.daemonService.resolveInteropRoot();
		const outboxPath = join(
			interopRoot,
			"interop",
			"notifications",
			"outbox",
			`${resolvedBatchId}.json`,
		);
		const processedPath = join(
			interopRoot,
			"interop",
			"notifications",
			"processed",
			`${resolvedBatchId}.json`,
		);
		const deadline = Date.now() + Math.max(300, Math.floor(timeoutMs));
		while (Date.now() < deadline) {
			try {
				const raw = await readFile(outboxPath, "utf-8");
				const parsed = JSON.parse(raw) as NotificationEnvelope;
				const applied = this.parseDailyReviewAppliedNotification(parsed, resolvedBatchId);
				if (!applied) {
					logger.warn(
						`[EventHook] ignored notification file batchId=${resolvedBatchId} reason=invalid_notification_shape`,
					);
					await this.archiveNotificationFile(outboxPath, processedPath);
					return null;
				}
				await this.archiveNotificationFile(outboxPath, processedPath);
				return applied;
			} catch {
				// continue polling
			}
			await this.delay(250);
		}
		return null;
	}

	private async emit(
		eventType: EventType,
		notePath: string,
		options?: EventHookEmitOptions,
		payload?: Record<string, unknown>,
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
			payload: payload ?? options?.payload,
		};

		const primaryRoot = this.daemonService.resolveInteropRoot();
		const mode = config.settings.eventHook.interopMode ?? "old";
		if (config.settings.eventHook.ensureOnEvent) {
			const ensured = await this.daemonService.ensureDaemonRunning("event");
			if (!ensured) {
				logger.warn(
					`[EventHook] ensure on event failed but continuing to emit event and wait for status interopRoot=${primaryRoot} lockPath=${this.daemonService.resolveLockFilePath()}`,
				);
			}
		}

		const inboxPaths: string[] = [];
		if (mode === "old" || mode === "both") {
			inboxPaths.push(join(primaryRoot, "interop", "events", "inbox", `${requestId}.json`));
		}
		if (mode === "new" || mode === "both") {
			const newRoot = this.resolveNewInteropRoot();
			inboxPaths.push(join(newRoot, "inbox", `${requestId}.json`));
		}

		const statusPath = join(
			primaryRoot,
			"interop",
			"status",
			`${requestId}.json`,
		);

		await Promise.all(inboxPaths.map((p) => this.writeJsonAtomic(p, event)));
		logger.info(
			`[EventHook] emitted eventType=${eventType} requestId=${requestId} note=${notePath} mode=${mode}`,
		);

		const timeoutMs = this.resolveStatusWaitMs();
		const status = await this.waitForStatus(statusPath, timeoutMs);
		if (!status) {
			return {
				requestId,
				status: "timeout",
				message:
					"ptune-log daemon is not running or not responding",
			};
		}

		return {
			requestId,
			status: status.status,
			message: status.message ?? `${status.status}`,
		};
	}

	private resolveNewInteropRoot(): string {
		const configured = config.settings.eventHook.interopRootNew.trim();
		if (configured) {
			return configured;
		}
		return join(homedir(), ".ptune-log", "interop-dev");
	}

	private resolveStatusWaitMs(): number {
		const value = config.settings.eventHook.statusWaitMs;
		if (!Number.isFinite(value)) {
			return 2500;
		}
		const rounded = Math.floor(value);
		return Math.max(300, rounded);
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

	private toStringArray(value: unknown): string[] {
		if (!Array.isArray(value)) {
			return [];
		}
		return value
			.map((entry) => (typeof entry === "string" ? entry : ""))
			.filter((entry) => entry.length > 0);
	}

	private parseDailyReviewAppliedNotification(
		notification: NotificationEnvelope,
		expectedBatchId: string,
	): DailyReviewAppliedResult | null {
		if (notification.event_type !== "review.applied") {
			return null;
		}
		const payload = notification.payload;
		if (!payload) {
			return null;
		}
		const batchId = this.toStringOrEmpty(payload.batch_id ?? notification.request_id);
		if (!batchId || batchId !== expectedBatchId) {
			return null;
		}
		const dailynoteKey = this.toStringOrEmpty(payload.dailynote_key);
		if (!dailynoteKey) {
			return null;
		}
		return {
			requestId: this.toStringOrEmpty(notification.request_id) || batchId,
			batchId,
			dailynoteKey,
			closeReason: this.toStringOrEmpty(payload.close_reason) || "unknown",
			appliedCount: this.toIntOrNull(payload.applied_count) ?? 0,
			failedCount: this.toIntOrNull(payload.failed_count) ?? 0,
			appliedNotes: this.toStringArray(payload.applied_notes),
			failedNotes: this.toStringArray(payload.failed_notes),
		};
	}

	private async archiveNotificationFile(
		sourcePath: string,
		targetPath: string,
	): Promise<void> {
		await mkdir(dirname(targetPath), { recursive: true });
		try {
			await rename(sourcePath, targetPath);
			return;
		} catch {
			const fallbackPath = targetPath.replace(/\.json$/i, `-${Date.now()}.json`);
			await rename(sourcePath, fallbackPath);
		}
	}

	private async delay(ms: number): Promise<void> {
		await new Promise<void>((resolve) => window.setTimeout(resolve, ms));
	}
}
