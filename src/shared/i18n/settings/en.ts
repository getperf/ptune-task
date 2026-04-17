// src/shared/i18n/settings/en.ts

export const settingsEn = {
	basic: {
		heading: "Basic settings",

		logLevel: {
			name: "Log level",
			desc: "Select log output level",
			options: {
				debug: "Debug",
				info: "Info",
				warn: "Warning",
				error: "Error",
				none: "None",
			},
		},

		enableLogFile: {
			name: "Enable log file",
			desc: "Save logs to a file",
		},

		eventHook: {
			heading: "Event hook for ptune-log",
			enabled: {
				name: "Enable event hook",
				desc: "Emit note-create, note-work-finished, note-attached, and note-review-requested events to the codex-md-export bridge",
			},
			interopRoot: {
				name: "Interop root",
				desc: "Root directory for event/status file bridge (empty = default)",
				placeholder: "C:/Users/<user>/.codex-md-export",
			},
			statusWaitMs: {
				name: "Status wait (ms)",
				desc: "How long to wait for status response before notice timeout",
				placeholder: "2500",
			},
		},
	},

	llm: {
		sectionTitle: "Language model settings",

		provider: {
			name: "Provider",
			desc: "Language model provider used for summarization",
			options: {
				openai: "OpenAI",
				claude: "Claude",
				gemini: "Gemini",
				custom: "Custom",
			},
		},

		apiKey: {
			name: "API key",
			desc: "Language model API key",
			placeholder: "Enter API key",
		},

		baseUrl: {
			name: "Base URL",
			desc: "Base API URL",
			placeholder: "https://api.openai.com/v1",
		},

		model: {
			name: "Model",
			desc: "Model name for summarization",
			placeholder: "Enter model name",
		},

		temperature: {
			name: "Temperature",
			desc: "Sampling temperature for summarization",
		},

		maxTokens: {
			name: "Max tokens",
			desc: "Maximum output tokens for summarization",
			placeholder: "1200",
		},
	},

	note: {
		sectionTitle: "Note settings",

		folderPrefix: {
			name: "Folder prefix",
			desc: "Prefix rule for project/journal folders",
			options: {
				serial: "Serial",
				date: "Date",
			},
		},

		notePrefix: {
			name: "Note prefix",
			desc: "Prefix rule for note filenames",
			options: {
				serial: "Serial",
				date: "Date",
			},
		},

		prefixDigits: {
			name: "Prefix digits",
			desc: "Zero-padding length for serial numbers",
		},

		template: {
			name: "Template file",
			desc: "Template used for new notes",
			placeholder: "_templates/note/default.md",
		},
	},

	projectIndex: {
		sectionTitle: "Project index settings",

		enableBasesSection: {
			name: "Enable bases section",
			desc: "When the bases plugin is enabled, add or maintain a bases view section in project index.md notes",
		},
	},

	review: {
		sectionTitle: "Review settings",

		notesReviewEnabledDefault: {
			name: "Daily notes review",
			desc: "Enable daily notes review by default when running the review command",
		},

		reviewPointOutputFormat: {
			name: "Reflection point format",
			desc: "Default output format for reflection points inside daily notes review",
			options: {
				outline: "Text outline",
				xmind: "Mind map",
			},
		},

		reviewTrendDays: {
			name: "Trend days",
			desc: "Number of past days to include in the daily trend table (1-30). Default is 7.",
			placeholder: "7",
		},

		maxSentences: {
			name: "Summary max sentences",
			desc: "Maximum number of sentences for language model note summaries. Use 0 to disable (detailed summary). Default is 0.",
			placeholder: "0",
		},

		xmindTemplatePath: {
			name: "XMind template path",
			desc: "Vault-relative path to the XMind template used for reflection points",
			placeholder: "_template/xmind/template_analysis.xmind",
		},
	},

	dailyNoteTask: {
		sectionTitle: "Daily task settings",

		templateManager: {
			name: "Templates",
			desc: "Select a template to apply or clear the daily task settings",
			open: "Open templates",
			options: {
				"software-development": "Software development",
			},
			modal: {
				title: "Daily task templates",
				desc: "This will overwrite the current daily note task settings. Select a template before applying it.",
				includeHabit: {
					name: "Update habit tasks too",
					desc: "When enabled, morning and evening habit tasks are updated to the default wake-up and sleep entries.",
				},
				template: {
					name: "Task template",
					desc: "Choose the template to apply",
				},
				apply: "Apply",
				clear: "Clear",
			},
			notice: {
				applied: "Applied the daily task template",
				cleared: "Cleared the daily task settings",
			},
		},

		habit: {
			morning: {
				name: "Morning list",
				desc: "Enter the tasks you perform each morning, one per line",
				placeholder: "Examples:\nexercise\nmeditate",
			},

			evening: {
				name: "Evening list",
				desc: "Enter the tasks you perform each evening, one per line",
				placeholder: "Examples:\nwrite journal\nstretch",
			},
		},

		tagSuggestions: {
			name: "Tag suggestions",
			desc: "Code completion candidates for task tags (one per line)",
			placeholder: "Examples:\ndesign\nresearch\nprototype\nimplementation\nverification",
		},

		goalSuggestions: {
			name: "Goal suggestions",
			desc: "Code completion candidates for task goals (one per line)",
			placeholder: "Examples:\nrequirements finalized\ndesign complete\nimplementation complete\ntest coverage added\nrefactoring complete\nbug fix complete",
		},

		subTaskTemplates: {
			name: "Sub-task templates",
			desc: "Code completion candidates for sub-tasks (one per line)",
			placeholder: "Examples:\nrequirements review #design 🍅x1\nuse cases #design 🍅x1\nchange analysis #research 🍅x1\nprototype #implementation 🍅x1\nbug fix #implementation 🍅x1\nreview #verification 🍅x1\nregression test #verification 🍅x1",
		},
	},

	snippet: {
		sectionTitle: "Snippet settings",

		snippetFile: {
			name: "Snippet file",
			desc: "Path to the snippet definition file",
			placeholder: "_snippets/snippets.md",
		},
	},
} as const;
