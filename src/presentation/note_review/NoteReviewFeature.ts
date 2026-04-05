import { App, Notice, Plugin, TFile } from "obsidian";
import { TextGenerationPort } from "../../application/llm/ports/TextGenerationPort";
import { LoadNoteSummaryUseCase } from "../../application/note_review/usecases/LoadNoteSummaryUseCase";
import { PreviewNoteSummaryUseCase } from "../../application/note_review/usecases/PreviewNoteSummaryUseCase";
import { SaveNoteSummaryUseCase } from "../../application/note_review/usecases/SaveNoteSummaryUseCase";
import { EventHookNoticeMapper } from "../../infrastructure/event_hook/EventHookNoticeMapper";
import { EventHookService } from "../../infrastructure/event_hook/EventHookService";
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
          void this.emitNoteReviewEvent(file.path);
        },
        async () => await this.previewUseCase.execute(file),
        llmAvailable
          ? undefined
          : {
              description: i18n.common.noteReview.modal.manualDescription,
              canRegenerate: false,
            },
      ).open();
    } catch (error) {
      logger.warn("[Command] NoteReviewFeature.open failed", error);
      new Notice(i18n.common.noteReview.notice.failed);
    }
  }

  private async emitNoteReviewEvent(notePath: string): Promise<void> {
    try {
      const result = await this.eventHookService.emitNoteReview(notePath);
      const message = this.eventHookNoticeMapper.map(result);
      logger.info(`[EventHook] note-review status=${result.status} requestId=${result.requestId} note=${notePath}`);
      if (this.shouldShowEventHookNotice(result.status, result.message)) {
        new Notice(message);
      }
    } catch (error) {
      logger.warn("[EventHook] note-review emit failed", error);
      new Notice(i18n.common.eventHook.notice.timeout);
    }
  }

  private shouldShowEventHookNotice(status: string, rawMessage: string): boolean {
    if (status === "skipped" && rawMessage === "event-hook is disabled") {
      return false;
    }
    return true;
  }
}
