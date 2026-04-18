import { PluginSettings } from "./types";
import { createEmptyDailyNoteTaskSettings } from "./dailyNoteTaskTemplates";

export const DEFAULT_SETTINGS: PluginSettings = {
	language: "ja",

	logLevel: "info",
	enableLogFile: false,
	llm: {
		provider: "openai",
		apiKey: "",
		baseUrl: "https://api.openai.com/v1",
		model: "gpt-5-mini",
		temperature: 0.2,
		maxTokens: 1200,
	},

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

	review: {
		sentenceMode: "llm",
		noteSummaryOutputFormat: "outline",
		reviewPointOutputFormat: "outline",
		reviewTrendDays: 7,
		taskReviewEnabledDefault: true,
		notesReviewEnabledDefault: true,
		taskReviewOutputFormat: "outline",
		xmindTemplatePath: "_template/xmind/template_analysis.xmind",
		maxSentences: 0,
	},

	habitTasks: {
		morning: [],
		evening: [],
	},

	dailyNoteTask: {
		...createEmptyDailyNoteTaskSettings(),
	},

	eventHook: {
		enabled: false,
		interopRoot: "",
		statusWaitMs: 2500,
		ensureOnEvent: true,
		pythonExePath: "",
		daemonArgs: "-m codex_md_export.main daemon --debug",
		lockFreshSeconds: 20,
	},
};
