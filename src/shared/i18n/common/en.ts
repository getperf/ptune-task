export const commonEn = {
	language: {
		name: "Language",
		desc: "Language used for UI",
		options: {
			ja: "Japanese",
			en: "English",
		},
	},

	notice: {
		apiKeyNotSet: "⚠️ API key not set",
		failed: "Operation failed",
	},

	action: {
		create: "Create",
		confirm: "Execute",
		cancel: "Cancel",
		close: "Close",
	},

	noteCreation: {
		menu: {
			createProjectFolder: "Create Project Folder",
			createProjectNote: "Create Note",
		},

		modal: {
			projectFolderTitle: "Create Project Folder",
			projectNoteTitle: "Create Note",
			targetLabel: "Target folder",
			titleLabel: "Title",
			titlePlaceholder: "Enter title",
		},

		notice: {
			titleRequired: "Title is required",
			invalidTitle: "Title contains invalid characters",
			projectFolderCreated: "Project folder created",
			projectNoteCreated: "Note created",
			createFailed: "Failed to create",
		},
	},

	daily: {
		section: {
			planned: { title: "Planned Tasks" },
			timelog: { title: "Time Log / Notes" },
			review: { title: "Task Review" },
			timetable: { title: "Time Table" },
			unfinished: { title: "Unfinished Tasks" },
			timeanalysis: { title: "Time Analysis" },
			memo: { title: "Reflection Memo" },
			tags: { title: "Tag List (Generated Today)" },
			unregistered: {
				title: "Unregistered Tag Candidates (Review Required)",
			},
			report: { title: "Daily Report" },
			reviewpoint: { title: "Reflection Points" },
		},

		planned: {
			comment: {
				line1: "Please fill in today's tasks before starting work.",
				line2: "After filling, export via Google Tasks to sync with ptune mobile app.",
			},
		},
	},

	review: {
		flag: {
			operationMiss: "Operation Miss",
			toolOrEnvIssue: "Environment Issue",
			decisionPending: "Pending",
			scopeExpanded: "Scope Expanded",
			unresolved: "Unresolved",
			newIssueFound: "New Issue",
			unknown: "Unknown",
		},
	},
} as const;
