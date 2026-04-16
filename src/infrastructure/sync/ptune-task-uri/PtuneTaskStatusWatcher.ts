import { App } from "obsidian";
import { logger } from "../../../shared/logger/loggerInstance";
import { PtuneSyncRunState } from "../ptune-sync-uri/PtuneSyncRunState";
import { PtuneSyncRunStateMapper } from "../ptune-sync-uri/PtuneSyncRunStateMapper";
import { PtuneSyncStatusDto } from "../ptune-sync-uri/PtuneSyncStatusDto";
import { PtuneSyncStatusParser } from "../ptune-sync-uri/PtuneSyncStatusParser";
import { PtuneTaskWorkDir } from "./PtuneTaskWorkDir";

export class PtuneTaskStatusWatcher {
	private readonly pollIntervalMs = 500;
	private readonly startupTimeoutMs = 3000;
	private readonly completionTimeoutMs = 90000;
	private readonly authLoginTimeoutMs = 300000;

	constructor(
		private readonly app: App,
		private readonly workDir: PtuneTaskWorkDir,
	) {}

	waitForAccepted<TData>(
		requestNonce: string,
		baseline: Date,
	): Promise<PtuneSyncStatusDto<TData>> {
		return this.waitFor(
			requestNonce,
			baseline,
			this.startupTimeoutMs,
			(runState) =>
				runState.phase === "accepted" ||
				runState.phase === "running" ||
				runState.phase === "completed",
		);
	}

	waitForCompletion<TData>(
		requestNonce: string,
		baseline: Date,
	): Promise<PtuneSyncStatusDto<TData>> {
		return this.waitForCompletionWithTimeout(
			requestNonce,
			baseline,
			this.completionTimeoutMs,
		);
	}

	waitForAuthLoginCompletion<TData>(
		requestNonce: string,
		baseline: Date,
	): Promise<PtuneSyncStatusDto<TData>> {
		return this.waitForCompletionWithTimeout(
			requestNonce,
			baseline,
			this.authLoginTimeoutMs,
		);
	}

	private waitForCompletionWithTimeout<TData>(
		requestNonce: string,
		baseline: Date,
		timeoutMs: number,
	): Promise<PtuneSyncStatusDto<TData>> {
		return this.waitFor(
			requestNonce,
			baseline,
			timeoutMs,
			(runState) =>
				runState.phase === "completed" ||
				runState.status === "success" ||
				runState.status === "error",
		);
	}

	private async waitFor<TData>(
		requestNonce: string,
		baseline: Date,
		timeoutMs: number,
		predicate: (runState: PtuneSyncRunState<TData>) => boolean,
	): Promise<PtuneSyncStatusDto<TData>> {
		const timeoutAt = Date.now() + timeoutMs;

		while (Date.now() < timeoutAt) {
			const envelope = await this.tryRead<TData>(requestNonce);
			if (
				!envelope ||
				!this.isNewer(envelope, baseline) ||
				!this.matchesRequest(envelope, requestNonce)
			) {
				await this.delay(this.pollIntervalMs);
				continue;
			}

			const runState = PtuneSyncRunStateMapper.fromDto(envelope);
			if (!predicate(runState)) {
				await this.delay(this.pollIntervalMs);
				continue;
			}

			return envelope;
		}

		throw new Error("ptune-task status wait timed out");
	}

	private async tryRead<TData>(
		requestNonce: string,
	): Promise<PtuneSyncStatusDto<TData> | null> {
		const path = this.workDir.getStatusFileRelative();

		if (!(await this.app.vault.adapter.exists(path))) {
			return null;
		}

		try {
			const raw = await this.app.vault.adapter.read(path);
			const envelope = PtuneSyncStatusParser.parse<TData>(raw);
			const runState = PtuneSyncRunStateMapper.fromDto(envelope);
			logger.debug(
				`[Sync] [PtuneTaskStatusWatcher] requestNonce=${requestNonce} envelopeNonce=${runState.requestNonce ?? "<none>"} phase=${runState.phase} status=${runState.status}`,
			);
			return envelope;
		} catch {
			return null;
		}
	}

	private matchesRequest(
		envelope: PtuneSyncStatusDto,
		requestNonce: string,
	): boolean {
		const runState = PtuneSyncRunStateMapper.fromDto(envelope);

		if (runState.requestNonce) {
			return runState.requestNonce === requestNonce;
		}

		return !runState.requestId || runState.requestId === requestNonce;
	}

	private isNewer(envelope: PtuneSyncStatusDto, baseline: Date): boolean {
		const timestamp = Date.parse(
			PtuneSyncRunStateMapper.fromDto(envelope).updatedAt,
		);
		return !Number.isNaN(timestamp) && timestamp > baseline.getTime();
	}

	private delay(ms: number): Promise<void> {
		return new Promise((resolve) => window.setTimeout(resolve, ms));
	}
}
