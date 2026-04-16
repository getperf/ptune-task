import { TFile } from "obsidian";
import { isTaskLine } from "../../completion/TaskLineDetector";
import { PlannedTaskSectionBuilder } from "../../planning/builders/PlannedTaskSectionBuilder";
import { TodayResolver } from "../services/TodayResolver";
import { DailyNoteRepository } from "../../../infrastructure/repository/DailyNoteRepository";
import { DailyNoteDocumentAdapter } from "../../../infrastructure/document/adapter/DailyNoteDocumentAdapter";
import { PtuneRuntime } from "../../../shared/PtuneRuntime";
import { logger } from "../../../shared/logger/loggerInstance";

export class EnsureTodayDailyNoteSectionsUseCase {
  private static readonly SECTION_SEPARATOR = "---";

  constructor(
    private readonly todayResolver: TodayResolver,
    private readonly repository: DailyNoteRepository,
    private readonly runtime: PtuneRuntime,
  ) {}

	async execute(file: TFile | null): Promise<boolean> {
		logger.debug(`[UseCase:start] EnsureTodayDailyNoteSectionsUseCase path=${file?.path ?? "null"}`);

    if (!file) {
      logger.debug("[UseCase:end] EnsureTodayDailyNoteSectionsUseCase skipped=no-file");
      return false;
    }

    const today = this.todayResolver.resolve();
    const todayPath = this.runtime.resolveNoteUri(today);

    if (file.path !== todayPath) {
      logger.debug(`[UseCase:end] EnsureTodayDailyNoteSectionsUseCase skipped=not-today path=${file.path} todayPath=${todayPath}`);
      return false;
    }

    const note = await this.repository.findByDate(today);

		if (!note) {
			logger.debug(`[UseCase:end] EnsureTodayDailyNoteSectionsUseCase skipped=note-missing date=${today}`);
			return false;
		}

		logger.debug(`[UseCase] EnsureTodayDailyNoteSectionsUseCase stage=adapter-create bytes=${note.content.length}`);
		const adapter = new DailyNoteDocumentAdapter(note.content);
		logger.debug("[UseCase] EnsureTodayDailyNoteSectionsUseCase stage=adapter-create completed");
		let updated = false;

		logger.debug("[UseCase] EnsureTodayDailyNoteSectionsUseCase stage=repair-dangling-heading start");
		if (adapter.repairDanglingTaskKeyHeadingBeforePlannedSection()) {
			logger.warn("[UseCase] EnsureTodayDailyNoteSectionsUseCase repaired dangling heading before planned section");
			updated = true;
		}
		logger.debug("[UseCase] EnsureTodayDailyNoteSectionsUseCase stage=repair-dangling-heading end");

		logger.debug("[UseCase] EnsureTodayDailyNoteSectionsUseCase stage=planned-section-check start");
		if (!adapter.hasSection("daily.section.planned.title")) {
			const habits = this.runtime.getHabitTasks();
			logger.debug(
        `[UseCase] EnsureTodayDailyNoteSectionsUseCase addPlannedSection morning=${habits.morning.length} evening=${habits.evening.length}`,
      );
      const sectionMarkdown = `${PlannedTaskSectionBuilder.buildForToday({
        runtime: this.runtime,
        keepExistingHabits: true,
      })}\n\n${EnsureTodayDailyNoteSectionsUseCase.SECTION_SEPARATOR}`;

      updated = adapter.upsertSection(
        "daily.section.planned.title",
        sectionMarkdown,
      ) || updated;
    } else {
      const plannedMarkdown = adapter.getSectionMarkdown("daily.section.planned.title").trimEnd();
      const taskLineCount = this.countTaskLines(plannedMarkdown);
      logger.debug(
        `[UseCase] EnsureTodayDailyNoteSectionsUseCase existingPlannedSection taskLines=${taskLineCount} bytes=${plannedMarkdown.length}`,
      );

      if (taskLineCount === 0) {
        const habits = this.runtime.getHabitTasks();
        logger.debug(
          `[UseCase] EnsureTodayDailyNoteSectionsUseCase refillPlannedSection morning=${habits.morning.length} evening=${habits.evening.length}`,
        );
        const sectionMarkdown = `${PlannedTaskSectionBuilder.buildForToday({
          runtime: this.runtime,
          keepExistingHabits: true,
        })}\n\n${EnsureTodayDailyNoteSectionsUseCase.SECTION_SEPARATOR}`;

        updated = adapter.upsertSection(
          "daily.section.planned.title",
          sectionMarkdown,
        ) || updated;
      }

      if (!adapter.hasSection("daily.section.timelog.title")) {
        const nextPlannedMarkdown = adapter.getSectionMarkdown("daily.section.planned.title").trimEnd();
        if (!nextPlannedMarkdown.endsWith(EnsureTodayDailyNoteSectionsUseCase.SECTION_SEPARATOR)) {
          adapter.mergeIntoSection(
            "daily.section.planned.title",
            EnsureTodayDailyNoteSectionsUseCase.SECTION_SEPARATOR,
          );
          updated = true;
        }
			}
		}
		logger.debug("[UseCase] EnsureTodayDailyNoteSectionsUseCase stage=planned-section-check end");

		if (!adapter.hasSection("daily.section.timelog.title")) {
			updated = adapter.upsertSection(
        "daily.section.timelog.title",
        EnsureTodayDailyNoteSectionsUseCase.SECTION_SEPARATOR,
      ) || updated;
    }

    if (!adapter.hasSection("daily.section.memo.title")) {
      updated = adapter.upsertSection(
        "daily.section.memo.title",
        EnsureTodayDailyNoteSectionsUseCase.SECTION_SEPARATOR,
			) || updated;
		}

		logger.debug(`[UseCase] EnsureTodayDailyNoteSectionsUseCase stage=save-check updated=${updated}`);
		if (!updated) {
			logger.debug(`[UseCase:end] EnsureTodayDailyNoteSectionsUseCase date=${today} updated=false`);
			return false;
		}

    await this.repository.save(note.withContent(adapter.toString()));

    logger.debug(`[UseCase:end] EnsureTodayDailyNoteSectionsUseCase date=${today} updated=true`);
    return true;
  }

  private countTaskLines(markdown: string): number {
    return markdown
      .split("\n")
      .filter((line) => isTaskLine(line))
      .length;
  }
}
