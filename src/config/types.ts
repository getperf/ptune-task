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

export type Lang = "ja" | "en";

export interface HabitTaskSettings {
	morning: string[];
	evening: string[];
}

export interface DailyNoteTaskSettings {
	habit: HabitTaskSettings;
	tagSuggestions: string[];
	goalSuggestions: string[];
	subTaskTemplates: string[];
}

export interface PluginSettings {
	language: Lang;

	logLevel: LogLevel;
	enableLogFile: boolean;

	note: NoteSettings;
	snippet: SnippetSettings;
	review: ReviewSettings;
	habitTasks: HabitTaskSettings;
	dailyNoteTask?: DailyNoteTaskSettings;
}
