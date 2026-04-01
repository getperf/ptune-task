export type LogLevel = "debug" | "info" | "warn" | "error" | "none";
export type LlmProvider = "openai" | "claude" | "gemini" | "custom";
export type ReviewOutputFormat = "outline" | "xmind";

export interface LlmSettings {
	provider: LlmProvider;
	apiKey: string;
	baseUrl: string;
	model: string;
	temperature: number;
	maxTokens: number;
}

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

export type SentenceMode = "none" | "llm";

export interface ReviewSettings {
	sentenceMode: SentenceMode;
	noteSummaryOutputFormat: ReviewOutputFormat;
	reviewPointOutputFormat: ReviewOutputFormat;
	reviewTrendDays: number;
	taskReviewEnabledDefault: boolean;
	notesReviewEnabledDefault: boolean;
	taskReviewOutputFormat: ReviewOutputFormat;
	xmindTemplatePath: string;
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
	llm: LlmSettings;

	note: NoteSettings;
	projectIndex: ProjectIndexSettings;
	snippet: SnippetSettings;
	review: ReviewSettings;
	habitTasks: HabitTaskSettings;
	dailyNoteTask?: DailyNoteTaskSettings;
}
