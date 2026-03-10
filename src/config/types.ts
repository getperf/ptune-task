export type LogLevel = "debug" | "info" | "warn" | "error" | "none";

export interface NoteSettings {
	folderPrefix: "serial" | "date";
	notePrefix: "serial" | "date";
	prefixDigits: number;
	templateText: string;
}

export interface SnippetSettings {
	filename: string;
}

export type SentenceMode = "none" | "llm";
export type NoteSummaryOutputFormat = "outliner" | "xmind";

export interface ReviewSettings {
	sentenceMode: SentenceMode;
	noteSummaryOutputFormat: NoteSummaryOutputFormat;
}

export interface PluginSettings {
	logLevel: LogLevel;
	enableLogFile: boolean;

	note: NoteSettings;
	snippet: SnippetSettings;
	review: ReviewSettings;
}
