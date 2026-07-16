import { App, Notice, Plugin, TFile } from "obsidian";
import { config } from "../../config/config";
import { isWorkNoteFrontmatter } from "../../domain/note/isWorkNote";
import { EventHookNoticeMapper } from "../../infrastructure/event_hook/EventHookNoticeMapper";
import { EventHookService } from "../../infrastructure/event_hook/EventHookService";
import { i18n } from "../../shared/i18n/I18n";
import { logger } from "../../shared/logger/loggerInstance";

export class NoteReviewFeature {
	constructor(
		private readonly app: App,
		private readonly eventHookService: EventHookService,
		private readonly eventHookNoticeMapper: EventHookNoticeMapper,
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

				// ptune-log イベントは作業ノート限定。dailynote が明確に無いノート
				// (state === false) では要約・接続メニューを出さない。判定不能 (null,
				// metadata 未 index) は従来どおり許可側に倒す。
				const state = this.workNoteState(file);
				if (state === false) {
					return;
				}

				// 要約可否はイベントフック有効化トグルに一本化。hook 無効時は
				// どのメニュー項目も出さない（emit も skipped になる死にメニューを防ぐ）。
				if (!config.settings.eventHook.enabled) {
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

				menu.addItem((item) =>
					item
						.setTitle(i18n.common.noteReview.command.hookMenu)
						.setIcon("cable")
						.onClick(() => {
							void this.emitNoteAttachedEvent(file);
						}),
				);
			}),
		);
	}

	/**
	 * 作業ノート判定。frontmatter に非空 `dailynote` があれば true。
	 * metadata cache が無い場合は判定不能として null を返す（呼び出し側は許可側に倒す）。
	 */
	private workNoteState(file: TFile): boolean | null {
		const cache = this.app.metadataCache.getFileCache(file);
		if (!cache) {
			return null;
		}
		return isWorkNoteFrontmatter(cache.frontmatter);
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
		// コマンド経路 (openForActiveFile) も通る choke point。判定順は hook 無効 →
		// 非作業ノート。コマンドはパレットから隠せないため、hook 無効時は silent skip
		// をやめて有効化を1回案内する。判定不能 (null) は許可側。
		if (!config.settings.eventHook.enabled) {
			new Notice(i18n.common.noteReview.notice.eventHookDisabled);
			return;
		}
		if (this.workNoteState(file) === false) {
			new Notice(i18n.common.noteReview.notice.nonWorkNote);
			return;
		}
		try {
			await this.requestPythonReview(file);
		} catch (error) {
			logger.warn("[Command] NoteReviewFeature.open failed", error);
			new Notice(i18n.common.noteReview.notice.failed);
		}
	}

	private async requestPythonReview(file: TFile): Promise<void> {
		const result = await this.eventHookService.emitNoteReviewRequested(
			file.path,
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

	private async emitNoteAttachedEvent(file: TFile): Promise<void> {
		// note-attached も作業ノート限定。判定不能 (null) は許可側。
		if (this.workNoteState(file) === false) {
			new Notice(i18n.common.noteReview.notice.nonWorkNote);
			return;
		}
		const notePath = file.path;
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
