import { DailyNote } from "../../domain/daily/DailyNote";
import { TaskEntry } from "../../domain/task/TaskEntry";
import { DailyNoteDocumentAdapter } from "../../infrastructure/document/adapter/DailyNoteDocumentAdapter";
import { DailyNoteRepository } from "../../infrastructure/repository/DailyNoteRepository";
import { logger } from "../../shared/logger/loggerInstance";
import { PtuneRuntime } from "../../shared/PtuneRuntime";

import { TodayResolver } from "../calendar/services/TodayResolver";
import { buildTaskTree } from "../planning/services/buildTaskTree";
import { generateTaskEntries } from "../planning/services/generateTaskEntries";
import { renderTaskTree } from "../planning/services/renderTaskTree";
import { MarkdownToJsonUseCase } from "../planning/usecases/MarkdownToJsonUseCase";

import { PlannedTaskSectionBuilder } from "../planning/builders/PlannedTaskSectionBuilder";
import { MergeTaskTreeService } from "../sync/merge/MergeTaskTreeService";

import { PullQuery } from "../sync/shared/dto/PullQuery";
import { PtuneSyncPort } from "../sync/shared/ports/PtuneSyncPort";
import { SyncPhase } from "../../domain/task/SyncPhase";

export class SyncAndRebuildDailyNoteUseCase {
  constructor(
    private readonly syncPort: PtuneSyncPort,
    private readonly todayResolver: TodayResolver,
    private readonly repository: DailyNoteRepository,
    private readonly runtime: PtuneRuntime,
    private readonly mergeService: MergeTaskTreeService = new MergeTaskTreeService(),
  ) {}

  async execute(): Promise<DailyNote> {
    logger.info("SyncAndRebuildDailyNoteUseCase started");

    const today = this.todayResolver.resolve();

    const note = await this.repository.findByDate(today);

    if (!note) {
      throw new Error("Daily note not found.");
    }

    const adapter = new DailyNoteDocumentAdapter(note.content);

    const phase = adapter.getSyncPhase() ?? SyncPhase.Planning;

    logger.debug(`Phase=${phase}`);

    const query: PullQuery = {
      list: "_Today",
      includeCompleted: phase === SyncPhase.Working,
    };

    // --- remote pull ---
    const raw = await this.syncPort.pull(query);

    const payload = JSON.parse(raw);

    logger.debug("payload=", payload);

    const remoteEntries = generateTaskEntries(payload);

    // --- local entries ---
    const localJson = MarkdownToJsonUseCase.execute(note.content);

    const localParsed = JSON.parse(localJson);

    const localEntries = (localParsed?.entries ?? []) as TaskEntry[];

    // --- merge ---
    const localTree = buildTaskTree(localEntries);

    const remoteTree = buildTaskTree(remoteEntries);

    const mergedTree = this.mergeService.merge(localTree, remoteTree);

    const rendered = renderTaskTree(mergedTree);

    // --- section rebuild ---
    const sectionMarkdown = PlannedTaskSectionBuilder.buildForToday({
      tasksMarkdown: rendered.taskListMarkdown,
      keepExistingHabits: true,
      runtime: this.runtime,
    });

    adapter.replaceSection("daily.section.planned.title", sectionMarkdown);

    // --- phase update ---
    if (!adapter.getSyncPhase()) {
      adapter.setSyncPhase(SyncPhase.Working);
    }

    // --- taskKeys update ---
    adapter.replaceTaskKeys(rendered.taskKeys);

    const updated = note.withContent(adapter.toString());

    await this.repository.save(updated);

    logger.info("SyncAndRebuildDailyNoteUseCase completed");

    return updated;
  }
}
