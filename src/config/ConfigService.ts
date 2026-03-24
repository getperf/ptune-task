import type { Plugin } from "obsidian";
import { DEFAULT_SETTINGS } from "./defaults";
import type { PluginSettings } from "./types";
import { logger } from "../shared/logger/loggerInstance";

export class ConfigService {
	private plugin?: Plugin;

	settings: PluginSettings = DEFAULT_SETTINGS;

	async load(plugin: Plugin) {
		this.plugin = plugin;

		const data =
			(await plugin.loadData()) as Partial<PluginSettings> | null;

		logger.debug(
			`[Service] ConfigService.load raw dailyNoteTaskHabit=${data?.dailyNoteTask?.habit ? "present" : "absent"} legacyHabitTasks=${data?.habitTasks ? "present" : "absent"}`,
		);

		this.settings = mergeSettings(DEFAULT_SETTINGS, data);

		logger.debug(
			`[Service] ConfigService.load merged dailyNoteTaskHabit morning=${this.settings.dailyNoteTask?.habit.morning.length ?? 0} evening=${this.settings.dailyNoteTask?.habit.evening.length ?? 0} legacyHabitTasks morning=${this.settings.habitTasks.morning.length} evening=${this.settings.habitTasks.evening.length}`,
		);
	}

	async save() {
		if (!this.plugin) return;

		await this.plugin.saveData(this.settings);
	}

	getSettings(): PluginSettings {
		return this.settings;
	}
}

function mergeSettings(
	defaults: PluginSettings,
	data: Partial<PluginSettings> | null,
): PluginSettings {
	if (!data) {
		return defaults;
	}

	const mergedLegacyHabitTasks = {
		...defaults.habitTasks,
		...(data.habitTasks ?? {}),
	};
	const hasDailyNoteHabit = data.dailyNoteTask?.habit !== undefined;
	const mergedDailyNoteHabit = hasDailyNoteHabit
		? {
			...defaults.dailyNoteTask.habit,
			...data.dailyNoteTask?.habit,
		}
		: mergedLegacyHabitTasks;

	logger.debug(
		`[Service] ConfigService.mergeSettings habitSource=${hasDailyNoteHabit ? "dailyNoteTask.habit" : "habitTasks"} morning=${mergedDailyNoteHabit.morning.length} evening=${mergedDailyNoteHabit.evening.length}`,
	);

	const mergedDailyNoteTask = defaults.dailyNoteTask
		? {
			...defaults.dailyNoteTask,
			...(data.dailyNoteTask ?? {}),
			habit: mergedDailyNoteHabit,
			tagSuggestions:
				data.dailyNoteTask?.tagSuggestions ?? defaults.dailyNoteTask.tagSuggestions,
			goalSuggestions:
				data.dailyNoteTask?.goalSuggestions ?? defaults.dailyNoteTask.goalSuggestions,
			subTaskTemplates:
				data.dailyNoteTask?.subTaskTemplates ?? defaults.dailyNoteTask.subTaskTemplates,
		}
		: data.dailyNoteTask;
	const mergedReview = {
		...defaults.review,
		...(data.review ?? {}),
	};

	if (
		data.review?.reviewPointOutputFormat === undefined
		&& data.review?.noteSummaryOutputFormat !== undefined
	) {
		mergedReview.reviewPointOutputFormat = data.review.noteSummaryOutputFormat;
	}

	return {
		...defaults,
		...data,
		llm: {
			...defaults.llm,
			...(data.llm ?? {}),
		},
		note: {
			...defaults.note,
			...(data.note ?? {}),
		},
		projectIndex: {
			...defaults.projectIndex,
			...(data.projectIndex ?? {}),
		},
		snippet: {
			...defaults.snippet,
			...(data.snippet ?? {}),
		},
		review: mergedReview,
		habitTasks: mergedLegacyHabitTasks,
		dailyNoteTask: mergedDailyNoteTask,
	};
}
