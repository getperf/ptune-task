import {
	App,
	Menu,
	Notice,
	Plugin,
	TAbstractFile,
	TFile,
	TFolder,
} from "obsidian";
import { NoteCreationRequest } from "../../application/note/NoteCreationModels";
import { NoteCreationUseCase } from "../../application/note/NoteCreationUseCase";
import { config } from "../../config/config";
import { ProjectFolder } from "../../domain/project/ProjectFolder";
import { TodayTaskKeyReader } from "../../infrastructure/obsidian/TodayTaskKeyReader";
import { EventHookNoticeMapper } from "../../infrastructure/event_hook/EventHookNoticeMapper";
import { EventHookService } from "../../infrastructure/event_hook/EventHookService";
import { i18n } from "../../shared/i18n/I18n";
import { logger } from "../../shared/logger/loggerInstance";
import { NoteCreatorModal } from "./NoteCreatorModal";

export class NoteCreationFeature {
	constructor(
		private readonly app: App,
		private readonly useCase: NoteCreationUseCase,
		private readonly taskKeyReader: TodayTaskKeyReader,
		private readonly eventHookService: EventHookService,
		private readonly eventHookNoticeMapper: EventHookNoticeMapper,
	) {}

	start(plugin: Plugin): void {
		plugin.registerEvent(
			this.app.workspace.on("file-menu", (menu, file) => {
				this.handleFileMenu(menu, file);
			}),
		);
	}

	private handleFileMenu(menu: Menu, file: TAbstractFile): void {
		if (!(file instanceof TFolder)) {
			return;
		}

		if (ProjectFolder.isProjectRootPath(file.path)) {
			menu.addItem((item) =>
				item
					.setTitle(i18n.common.noteCreation.menu.createProjectFolder)
					.setIcon("folder-plus")
					.onClick(() => {
						void this.openProjectFolderModal(file);
					}),
			);
		}

		if (ProjectFolder.isProjectFolderPath(file.path)) {
			menu.addItem((item) =>
				item
					.setTitle(i18n.common.noteCreation.menu.createProjectNote)
					.setIcon("document")
					.onClick(() => {
						void this.openProjectNoteModal(file);
					}),
			);
		}
	}

	private openProjectFolderModal(folder: TFolder): void {
		logger.debug(
			`[Command] NoteCreationFeature.openProjectFolderModal start path=${folder.path}`,
		);

		try {
			const prefix = this.useCase.getProjectFolderPrefix(folder.path);
			const taskKeyOptions = this.taskKeyReader.readToday();
			logger.debug(
				`[Command] NoteCreationFeature.openProjectFolderModal prefix=${prefix} path=${folder.path}`,
			);
			logger.debug(
				`[Command] NoteCreationFeature.openProjectFolderModal taskOptions=${taskKeyOptions.length} path=${folder.path}`,
			);

			new NoteCreatorModal(
				this.app,
				"project-folder",
				folder.path,
				prefix,
				taskKeyOptions,
				config.settings.eventHook.enabled,
				async (input) => {
					if (!this.validateTitle(input.title)) {
						return false;
					}

					try {
						const created = await this.useCase.createProjectFolder(
							this.buildRequest(
								folder.path,
								input.title,
								input.taskKey,
							),
						);
						await this.openFileIfExists(created.indexNotePath);
						logger.info(
							`[Command] NoteCreationFeature.notice ${i18n.common.noteCreation.notice.projectFolderCreated} path=${created.path}`,
						);
						new Notice(
							i18n.common.noteCreation.notice
								.projectFolderCreated,
						);
						return true;
					} catch (error) {
						logger.warn(
							"[Command] NoteCreationFeature.openProjectFolderModal failed",
							error,
						);
						const message = this.formatError(error);
						logger.warn(
							`[Command] NoteCreationFeature.notice ${message}`,
						);
						new Notice(message);
						return false;
					}
				},
			).open();
		} catch (error) {
			logger.warn(
				"[Command] NoteCreationFeature.openProjectFolderModal failedBeforeOpen",
				error,
			);
			const message = this.formatError(error);
			logger.warn(`[Command] NoteCreationFeature.notice ${message}`);
			new Notice(message);
		}
	}

	private openProjectNoteModal(folder: TFolder): void {
		logger.debug(
			`[Command] NoteCreationFeature.openProjectNoteModal start path=${folder.path}`,
		);

		try {
			const prefix = this.useCase.getProjectNotePrefix(folder.path);
			const taskKeyOptions = this.taskKeyReader.readToday();
			logger.debug(
				`[Command] NoteCreationFeature.openProjectNoteModal prefix=${prefix} path=${folder.path}`,
			);
			logger.debug(
				`[Command] NoteCreationFeature.openProjectNoteModal taskOptions=${taskKeyOptions.length} path=${folder.path}`,
			);

			new NoteCreatorModal(
				this.app,
				"project-note",
				folder.path,
				prefix,
				taskKeyOptions,
				config.settings.eventHook.enabled,
				async (input) => {
					if (!this.validateTitle(input.title)) {
						return false;
					}

					try {
						const created = await this.useCase.createProjectNote(
							this.buildRequest(
								folder.path,
								input.title,
								input.taskKey,
							),
						);
						await this.openFileIfExists(created.notePath);
						logger.info(
							`[Command] NoteCreationFeature.notice ${i18n.common.noteCreation.notice.projectNoteCreated} path=${created.notePath}`,
						);
						new Notice(
							i18n.common.noteCreation.notice.projectNoteCreated,
						);
						void this.emitNoteCreateEvent(
							created.notePath,
							input.eventHookEnabled,
						);
						return true;
					} catch (error) {
						logger.warn(
							"[Command] NoteCreationFeature.openProjectNoteModal failed",
							error,
						);
						const message = this.formatError(error);
						logger.warn(
							`[Command] NoteCreationFeature.notice ${message}`,
						);
						new Notice(message);
						return false;
					}
				},
			).open();
		} catch (error) {
			logger.warn(
				"[Command] NoteCreationFeature.openProjectNoteModal failedBeforeOpen",
				error,
			);
			const message = this.formatError(error);
			logger.warn(`[Command] NoteCreationFeature.notice ${message}`);
			new Notice(message);
		}
	}

	private buildRequest(
		parentPath: string,
		title: string,
		taskKey?: string,
	): NoteCreationRequest {
		return {
			parentPath,
			title,
			taskKey,
		};
	}

	private validateTitle(title: string): boolean {
		const trimmed = title.trim();
		const t = i18n.common.noteCreation.notice;

		if (!trimmed) {
			logger.warn(
				`[Command] NoteCreationFeature.notice ${t.titleRequired}`,
			);
			new Notice(t.titleRequired);
			return false;
		}

		if (/[\\/#%&{}<>*? $!':@+`|="]/.test(trimmed)) {
			logger.warn(
				`[Command] NoteCreationFeature.notice ${t.invalidTitle} title=${trimmed}`,
			);
			new Notice(t.invalidTitle);
			return false;
		}

		return true;
	}

	private async openFileIfExists(path: string): Promise<void> {
		const file = this.app.vault.getAbstractFileByPath(path);

		if (!(file instanceof TFile)) {
			return;
		}

		await this.app.workspace.getLeaf(false).openFile(file);
	}

	private formatError(error: unknown): string {
		const base = i18n.common.noteCreation.notice.createFailed;

		if (error instanceof Error) {
			return `${base}: ${error.message}`;
		}

		return base;
	}

	private async emitNoteCreateEvent(
		notePath: string,
		eventHookEnabled?: boolean,
	): Promise<void> {
		if (eventHookEnabled === false) {
			logger.info(
				`[EventHook] note-create skipped by modal toggle note=${notePath}`,
			);
			return;
		}

		try {
			const result = await this.eventHookService.emitNoteCreate(
				notePath,
				{ enabledOverride: eventHookEnabled },
			);
			const message = this.eventHookNoticeMapper.map(result);
			logger.info(
				`[EventHook] note-create status=${result.status} requestId=${result.requestId} note=${notePath}`,
			);
			if (this.shouldShowEventHookNotice(result.status, result.message)) {
				new Notice(message);
			}
		} catch (error) {
			logger.warn("[EventHook] note-create emit failed", error);
			new Notice(i18n.common.eventHook.notice.timeout);
		}
	}

	private shouldShowEventHookNotice(
		status: string,
		rawMessage: string,
	): boolean {
		if (status === "skipped" && rawMessage === "event-hook is disabled") {
			return false;
		}
		if (status === "timeout") {
			// Timeout is occasionally observed as a false negative while daemon processes in background.
			return false;
		}
		return true;
	}
}
