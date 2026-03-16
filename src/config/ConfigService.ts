import type { Plugin } from "obsidian";
import { DEFAULT_SETTINGS } from "./defaults";
import type { PluginSettings } from "./types";

export class ConfigService {
	private plugin?: Plugin;

	settings: PluginSettings = DEFAULT_SETTINGS;

	async load(plugin: Plugin) {
		this.plugin = plugin;

		const data =
			(await plugin.loadData()) as Partial<PluginSettings> | null;

		this.settings = mergeSettings(DEFAULT_SETTINGS, data);
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

	const mergedDailyNoteTask = defaults.dailyNoteTask
		? {
			...defaults.dailyNoteTask,
			...(data.dailyNoteTask ?? {}),
			habit: {
				...defaults.dailyNoteTask.habit,
				...(data.dailyNoteTask?.habit ?? {}),
			},
			tagSuggestions:
				data.dailyNoteTask?.tagSuggestions ?? defaults.dailyNoteTask.tagSuggestions,
			goalSuggestions:
				data.dailyNoteTask?.goalSuggestions ?? defaults.dailyNoteTask.goalSuggestions,
			subTaskTemplates:
				data.dailyNoteTask?.subTaskTemplates ?? defaults.dailyNoteTask.subTaskTemplates,
		}
		: data.dailyNoteTask;

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
		snippet: {
			...defaults.snippet,
			...(data.snippet ?? {}),
		},
		review: {
			...defaults.review,
			...(data.review ?? {}),
		},
		habitTasks: {
			...defaults.habitTasks,
			...(data.habitTasks ?? {}),
		},
		dailyNoteTask: mergedDailyNoteTask,
	};
}
