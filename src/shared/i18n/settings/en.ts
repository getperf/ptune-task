// src/shared/i18n/settings/en.ts

export const settingsEn = {
	basic: {
		heading: "Basic Settings",

		logLevel: {
			name: "Log Level",
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
			name: "Enable Log File",
			desc: "Save logs to a file",
		},

		eventHook: {
			heading: "ptune-log Event Hook",
			enabled: {
				name: "Enable event hook",
				desc: "Emit note-create and note-review events to the codex-md-export bridge",
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
		sectionTitle: "LLM Settings",

		provider: {
			name: "Provider",
			desc: "LLM provider used for summarization",
			options: {
				openai: "OpenAI",
				claude: "Claude",
				gemini: "Gemini",
				custom: "Custom",
			},
		},

		apiKey: {
			name: "API Key",
			desc: "LLM API key",
			placeholder: "sk-...",
		},

		baseUrl: {
			name: "Base URL",
			desc: "Base API URL",
			placeholder: "https://api.openai.com/v1",
		},

		model: {
			name: "Model",
			desc: "Model name for summarization",
			placeholder: "gpt-5-mini",
		},

		temperature: {
			name: "Temperature",
			desc: "Sampling temperature for summarization",
		},

		maxTokens: {
			name: "Max Tokens",
			desc: "Maximum output tokens for summarization",
			placeholder: "1200",
		},
	},

	note: {
		sectionTitle: "Note Settings",

		folderPrefix: {
			name: "Folder Prefix",
			desc: "Prefix rule for project/journal folders",
			options: {
				serial: "Serial",
				date: "Date",
			},
		},

		notePrefix: {
			name: "Note Prefix",
			desc: "Prefix rule for note filenames",
			options: {
				serial: "Serial",
				date: "Date",
			},
		},

		prefixDigits: {
			name: "Prefix Digits",
			desc: "Zero-padding length for serial numbers",
		},

		template: {
			name: "Template File",
			desc: "Template used for new notes",
			placeholder: "_templates/note/default.md",
		},
	},

	projectIndex: {
		sectionTitle: "Project Index Settings",

		enableBasesSection: {
			name: "Enable Bases section",
			desc: "When the Bases plugin is enabled, add or maintain a Bases view section in project index.md notes",
		},
	},

	review: {
		sectionTitle: "Review Settings",

		notesReviewEnabledDefault: {
			name: "Daily notes review",
			desc: "Enable daily notes review by default when running the review command",
		},

		reviewPointOutputFormat: {
			name: "Reflection point format",
			desc: "Default output format for reflection points inside daily notes review",
			options: {
				outline: "outline",
				xmind: "xmind",
			},
		},

		reviewTrendDays: {
			name: "Trend days",
			desc: "Number of past days to include in the daily trend table (1-30). Default is 7.",
			placeholder: "7",
		},

		xmindTemplatePath: {
			name: "XMind template path",
			desc: "Vault-relative path to the XMind template used for reflection points",
			placeholder: "_template/xmind/template_analysis.xmind",
		},
	},

	dailyNoteTask: {
		sectionTitle: "Daily Task Settings",

		templateManager: {
			name: "Templates",
			desc: "Select a template to apply or clear the daily task settings",
			open: "Open templates",
			options: {
				"software-development": "Software development",
			},
			modal: {
				title: "Daily task templates",
				desc: "This will overwrite the current Daily Note task settings. Select a template before applying it.",
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
				placeholder: "e.g. Exercise\nMeditate",
			},

			evening: {
				name: "Evening list",
				desc: "Enter the tasks you perform each evening, one per line",
				placeholder: "e.g. Write journal\nStretch",
			},
		},

		tagSuggestions: {
			name: "Tag suggestions",
			desc: "Code completion candidates for task tags (one per line)",
			placeholder: "Design\nResearch\nPrototype\nImplementation\nVerification",
		},

		goalSuggestions: {
			name: "Goal suggestions",
			desc: "Code completion candidates for task goals (one per line)",
			placeholder: "Requirements finalized\nDesign complete\nImplementation complete\nTest coverage added\nRefactoring complete\nBug fix complete",
		},

		subTaskTemplates: {
			name: "Sub-task templates",
			desc: "Code completion candidates for sub-tasks (one per line)",
			placeholder: "Requirements review #Design 🍅x1\nUse cases #Design 🍅x1\nChange analysis #Research 🍅x1\nPrototype #Implementation 🍅x1\nBug fix #Implementation 🍅x1\nReview #Verification 🍅x1\nRegression test #Verification 🍅x1",
		},
	},

	snippet: {
		sectionTitle: "Snippet Settings",

		snippetFile: {
			name: "Snippet File",
			desc: "Path to the snippet definition file",
			placeholder: "_snippets/snippets.md",
		},
	},
} as const;
