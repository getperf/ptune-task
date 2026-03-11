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

	snippet: {
		sectionTitle: "Snippet Settings",

		snippetFile: {
			name: "Snippet File",
			desc: "Path to the snippet definition file",
			placeholder: "_snippets/snippets.md",
		},
	},
} as const;
