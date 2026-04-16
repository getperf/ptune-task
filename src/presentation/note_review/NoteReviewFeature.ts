import { App, Notice, Plugin, TFile } from "obsidian";
import { TextGenerationPort } from "../../application/llm/ports/TextGenerationPort";
import { LoadNoteSummaryUseCase } from "../../application/note_review/usecases/LoadNoteSummaryUseCase";
import { PreviewNoteSummaryUseCase } from "../../application/note_review/usecases/PreviewNoteSummaryUseCase";
import { SaveNoteSummaryUseCase } from "../../application/note_review/usecases/SaveNoteSummaryUseCase";
import { config } from "../../config/config";
import { EventHookNoticeMapper } from "../../infrastructure/event_hook/EventHookNoticeMapper";
import { EventHookService } from "../../infrastructure/event_hook/EventHookService";
import { PythonReviewConfigSyncService } from "../../infrastructure/review/PythonReviewConfigSyncService";
import { i18n } from "../../shared/i18n/I18n";
import { logger } from "../../shared/logger/loggerInstance";
import { NoteSummaryModal } from "./NoteSummaryModal";

export class NoteReviewFeature {
	constructor(
		private readonly app: App,
		private readonly textGenerator: TextGenerationPort,
		private readonly loadUseCase: LoadNoteSummaryUseCase,
		private readonly previewUseCase: PreviewNoteSummaryUseCase,
		private readonly saveUseCase: SaveNoteSummaryUseCase,
		private readonly eventHookService: EventHookService,
		private readonly eventHookNoticeMapper: EventHookNoticeMapper,
		private readonly reviewConfigSyncService: PythonReviewConfigSyncService,
	) {}

	start(plugin: Plugin): void {
		plugin.addCommand({
			id: "note-review-current",
			name: i18n.common.noteReview.command.current,
			callback: () => {
				void this.openForActiveFile();
			},
		});

		plugin.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				if (!(file instanceof TFile) || file.extension !== "md") {
					return;
				}

				menu.addItem((item) =>
					item
						.setTitle(i18n.common.noteReview.command.menu)
						.setIcon("bot")
						.onClick(() => {
							void this.open(file);
						}),
				);

				if (config.settings.eventHook.enabled) {
					menu.addItem((item) =>
						item
							.setTitle(i18n.common.noteReview.command.hookMenu)
							.setIcon("cable")
							.onClick(() => {
								void this.emitNoteAttachedEvent(file.path);
							}),
					);
				}
			}),
		);
	}

	private async openForActiveFile(): Promise<void> {
		const file = this.app.workspace.getActiveFile();

		if (!file) {
			new Notice(i18n.common.noteReview.notice.noActiveNote);
			return;
		}

		await this.open(file);
	}

	private async open(file: TFile): Promise<void> {
		try {
			if (config.settings.eventHook.enabled) {
				await this.requestPythonReview(file);
				return;
			}

			const llmAvailable = this.textGenerator.hasValidApiKey();
			const preview = llmAvailable
				? await this.previewUseCase.execute(file)
				: await this.loadUseCase.execute(file);
			new NoteSummaryModal(
				this.app,
				preview,
				async (value) => {
					await this.saveUseCase.execute(file, value);
					new Notice(i18n.common.noteReview.notice.saved);
					void this.emitNoteWorkFinishedEvent(file.path);
				},
				async () => await this.previewUseCase.execute(file),
				llmAvailable
					? undefined
					: {
							description:
								i18n.common.noteReview.modal.manualDescription,
							canRegenerate: false,
						},
			).open();
		} catch (error) {
			logger.warn("[Command] NoteReviewFeature.open failed", error);
			new Notice(i18n.common.noteReview.notice.failed);
		}
	}

	private async requestPythonReview(file: TFile): Promise<void> {
		if (!this.textGenerator.hasValidApiKey()) {
			new Notice(i18n.common.noteReview.notice.apiKeyNotSet);
			return;
		}

		const synced = await this.reviewConfigSyncService.sync();
		const result = await this.eventHookService.emitNoteReviewRequested(
			file.path,
			{
				profiles_file: synced.profilesFile,
				credentials_file: synced.credentialsFile,
				profile_id: synced.profileId,
			},
		);
		logger.info(
			`[EventHook] note-review-requested status=${result.status} requestId=${result.requestId} note=${file.path}`,
		);
		if (this.shouldShowReviewRequestNotice(result.status, result.message)) {
			const message = this.mapReviewRequestNotice(
				result.status,
				result.message,
			);
			new Notice(message);
		}
	}

	private async emitNoteWorkFinishedEvent(notePath: string): Promise<void> {
		try {
			const result =
				await this.eventHookService.emitNoteWorkFinished(notePath);
			const message = this.eventHookNoticeMapper.map(result);
			logger.info(
				`[EventHook] note-work-finished status=${result.status} requestId=${result.requestId} note=${notePath}`,
			);
			if (this.shouldShowEventHookNotice(result.status, result.message)) {
				new Notice(message);
			}
		} catch (error) {
			logger.warn("[EventHook] note-work-finished emit failed", error);
			new Notice(i18n.common.eventHook.notice.timeout);
		}
	}

	private async emitNoteAttachedEvent(notePath: string): Promise<void> {
		try {
			const result =
				await this.eventHookService.emitNoteAttached(notePath);
			const message = this.eventHookNoticeMapper.map(result);
			logger.info(
				`[EventHook] note-attached status=${result.status} requestId=${result.requestId} note=${notePath}`,
			);
			if (
				this.shouldShowEventHookNotice(result.status, result.message, {
					suppressTimeout: true,
				})
			) {
				new Notice(message);
			}
		} catch (error) {
			logger.warn("[EventHook] note-attached emit failed", error);
			// note-attached timeout is often a false negative while daemon continues processing.
			// Keep this path silent to avoid noisy "daemon not running" notices.
		}
	}

	private shouldShowEventHookNotice(
		status: string,
		rawMessage: string,
		options?: { suppressTimeout?: boolean },
	): boolean {
		if (status === "skipped" && rawMessage === "event-hook is disabled") {
			return false;
		}
		if (options?.suppressTimeout === true && status === "timeout") {
			return false;
		}
		return true;
	}

	private shouldShowReviewRequestNotice(
		status: string,
		rawMessage: string,
	): boolean {
		if (status === "skipped" && rawMessage === "event-hook is disabled") {
			return false;
		}
		return true;
	}

	private mapReviewRequestNotice(status: string, rawMessage: string): string {
		const t = i18n.common.noteReview.notice;
		if (status === "success") {
			return t.reviewRequested;
		}
		if (status === "timeout") {
			return t.reviewRequestedTimeout;
		}
		return this.eventHookNoticeMapper.map({
			requestId: "",
			status,
			message: rawMessage,
		});
	}
}
