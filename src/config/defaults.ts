import { PluginSettings } from "./types";
import { createEmptyDailyNoteTaskSettings } from "./dailyNoteTaskTemplates";

export const DEFAULT_SETTINGS: PluginSettings = {
	language: "ja",

	logLevel: "info",
	enableLogFile: false,
	note: {
		folderPrefix: "serial",
		notePrefix: "serial",
		prefixDigits: 3,
		templateText: "",
	},

	projectIndex: {
		enabled: true,
		enableBasesSection: true,
	},

	snippet: {
		filename: "snippet.md",
	},

	habitTasks: {
		morning: [],
		evening: [],
	},

	taskReview: {
		trendDays: 7,
	},

	dailyNoteTask: {
		...createEmptyDailyNoteTaskSettings(),
	},

	eventHook: {
		enabled: false,
		interopRoot: "",
		statusWaitMs: 5000,
		ensureOnEvent: true,
		pythonExePath: "",
		lockFreshSeconds: 20,
	},
};
