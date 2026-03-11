import { PluginSettings } from "./types";

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

	snippet: {
		filename: "snippet.md",
	},

	review: {
		sentenceMode: "llm",
		noteSummaryOutputFormat: "xmind",
	},
};
