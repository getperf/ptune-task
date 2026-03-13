// src/application/sync/pull/PullAndMergeTodayUseCase.ts

import { DailyNote } from "../../../domain/daily/DailyNote";
import { DailyNoteRepository } from "../../../infrastructure/repository/DailyNoteRepository";
import { Logger } from "../../../shared/logger/Logger";
import { TodayResolver } from "../../calendar/services/TodayResolver";
import { CreateDailyNoteUseCase } from "../../calendar/usecases/CreateDailyNoteUseCase";
import { PtuneSyncPort } from "../shared/ports/PtuneSyncPort";

import { generateTaskEntries } from "../../planning/services/generateTaskEntries";
import { buildTaskTree } from "../../planning/services/buildTaskTree";
import { renderTaskTree } from "../../planning/services/renderTaskTree";
import { MarkdownToJsonUseCase } from "../../planning/usecases/MarkdownToJsonUseCase";
import { MergeTaskTreeService } from "../merge/MergeTaskTreeService";
import { DailyNoteDocumentAdapter } from "../../../infrastructure/document/adapter/DailyNoteDocumentAdapter";
import { TaskDocumentFactory } from "../../../domain/planning/TaskDocument";
import { TaskEntryNormalizer } from "../shared/normalizers/TaskEntryNormalizer";
import { PtuneRuntime } from "../../../shared/PtuneRuntime";
import { PlannedTaskSectionBuilder } from "../../planning/builders/PlannedTaskSectionBuilder";
import { SyncPhase } from "../../../domain/sync/SyncPhase";
import { HabitService } from "../../../domain/planning/HabitService";

export class PullAndMergeTodayUseCase {
  constructor(
    private readonly syncPort: PtuneSyncPort,
    private readonly todayResolver: TodayResolver,
    private readonly repository: DailyNoteRepository,
    private readonly createDailyNoteUseCase: CreateDailyNoteUseCase,
    private readonly runtime: PtuneRuntime,
    private readonly mergeService: MergeTaskTreeService = new MergeTaskTreeService(),
  ) {}

  async execute(): Promise<{ note: DailyNote; created: boolean }> {
    const logger = Logger.get();
    logger.info("PullAndMergeTodayUseCase started");

    const today = this.todayResolver.resolve();

    let note = await this.repository.findByDate(today);
    let created = false;

    if (!note) {
      const result = await this.createDailyNoteUseCase.execute(today);

      note = result.note;
      created = true;
    }

    const adapter = new DailyNoteDocumentAdapter(note.content);

    const phase = adapter.getSyncPhase() ?? SyncPhase.Planning;

    const raw = await this.syncPort.pull({
      list: "_Today",
      includeCompleted: phase === SyncPhase.Working,
    });

    const payload = JSON.parse(raw);

    const habits = this.runtime.getHabitTasks();

    const habitSet = new Set([...habits.morning, ...habits.evening]);

    // --- Google entries ---
    const googleEntriesRaw = generateTaskEntries(payload);

    const googleEntries = HabitService.filterEntries(
      googleEntriesRaw,
      habitSet,
    );

    logger.debug(
      "googleEntries:",
      googleEntries.map((e) => e.title),
    );
    const googleTree = buildTaskTree(googleEntries);

    // --- Local parse ---
    const localJson = MarkdownToJsonUseCase.execute(note.content);

    const taskDoc = TaskDocumentFactory.fromJson(localJson);

    const localEntriesRaw = TaskEntryNormalizer.toDomain(taskDoc);

    const localEntries = HabitService.filterEntries(localEntriesRaw, habitSet);

    logger.debug(
      "localEntries:",
      localEntries.map((e) => e.title),
    );
    const localTree = buildTaskTree(localEntries);

    // --- Merge ---
    const mergedTree = this.mergeService.merge(localTree, googleTree);

    // --- Render ---
    const rendered = renderTaskTree(mergedTree);
    logger.debug("rendered.taskListMarkdown:", rendered.taskListMarkdown);
    const isFirstPull = adapter.getTaskKeysCount() === 0;

    // --- Habit detection ---
    // const habits = this.runtime.getHabitTasks();
    logger.debug("runtime habits:", habits);
    // const habitSet = new Set([...habits.morning, ...habits.evening]);

    const hasHabit = localEntries.some((e) => habitSet.has(e.title));

    // --- Section build ---
    // let sectionMarkdown: string;
    const sectionMarkdown = PlannedTaskSectionBuilder.buildForToday({
      tasksMarkdown: rendered.taskListMarkdown,
      runtime: this.runtime,
      keepExistingHabits: false,
    });
    // if (hasHabit) {
    //   sectionMarkdown = PlannedTaskSectionBuilder.buildForToday({
    //     tasksMarkdown: rendered.taskListMarkdown,
    //     keepExistingHabits: false,
    //     runtime: this.runtime,
    //   });
    // } else {
    //   sectionMarkdown = rendered.taskListMarkdown;
    // }
    logger.debug("sectionMarkdown(before replace):", sectionMarkdown);
    adapter.replaceSection("daily.section.planned.title", sectionMarkdown);

    adapter.replaceTaskKeys(rendered.taskKeys);

    const updated = note.withContent(adapter.toString());

    await this.repository.save(updated);

    logger.info("PullAndMergeTodayUseCase completed");

    return { note: updated, created };
  }
}
