export type LogLevel = "debug" | "info" | "warn" | "error" | "none";
export interface NoteSettings {
	folderPrefix: "serial" | "date";
	notePrefix: "serial" | "date";
	prefixDigits: number;
	templateText: string;
}

export interface ProjectIndexSettings {
	enabled: boolean;
	enableBasesSection: boolean;
}

export interface SnippetSettings {
	filename: string;
}

export interface TaskReviewSettings {
	trendDays: number;
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

export interface EventHookSettings {
	enabled: boolean;
	interopRoot: string;
	statusWaitMs: number;
	ensureOnEvent: boolean;
	pythonExePath: string;
	lockFreshSeconds: number;
}

export interface PluginSettings {
	language: Lang;

	logLevel: LogLevel;
	enableLogFile: boolean;
	note: NoteSettings;
	projectIndex: ProjectIndexSettings;
	snippet: SnippetSettings;
	taskReview: TaskReviewSettings;
	habitTasks: HabitTaskSettings;
	dailyNoteTask?: DailyNoteTaskSettings;
	eventHook: EventHookSettings;
}
