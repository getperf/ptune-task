import { TFile } from "obsidian";
import { PlannedTaskSectionBuilder } from "../../planning/builders/PlannedTaskSectionBuilder";
import { TodayResolver } from "../services/TodayResolver";
import { DailyNoteRepository } from "../../../infrastructure/repository/DailyNoteRepository";
import { DailyNoteDocumentAdapter } from "../../../infrastructure/document/adapter/DailyNoteDocumentAdapter";
import { PtuneRuntime } from "../../../shared/PtuneRuntime";

export class EnsureTodayDailyNoteSectionsUseCase {
	constructor(
		private readonly todayResolver: TodayResolver,
		private readonly repository: DailyNoteRepository,
		private readonly runtime: PtuneRuntime,
	) {}

	async execute(file: TFile | null): Promise<boolean> {
		if (!file) {
			return false;
		}

		const today = this.todayResolver.resolve();
		const todayPath = this.runtime.resolveNoteUri(today);

		if (file.path !== todayPath) {
			return false;
		}

		const note = await this.repository.findByDate(today);

		if (!note) {
			return false;
		}

		const adapter = new DailyNoteDocumentAdapter(note.content);

		if (adapter.hasSection("daily.section.planned.title")) {
			return false;
		}

		const sectionMarkdown = PlannedTaskSectionBuilder.buildForToday({
			runtime: this.runtime,
			keepExistingHabits: true,
		});

		const updated = adapter.upsertSection(
			"daily.section.planned.title",
			sectionMarkdown,
		);

		if (!updated) {
			return false;
		}

		await this.repository.save(note.withContent(adapter.toString()));

		return true;
	}
}
