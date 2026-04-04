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

	commands: {
		pullToday: "Pull Today",
		pushToday: "Push Today",
		dailyReview: "Generate Daily Review",
		login: "Login",
		authStatus: "Auth Status",
	},

	pull: {
		notice: {
			createdAndPulled: "Daily note created and pulled.",
			completed: "Pull completed.",
		},
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
			taskKeyLabel: "Select task",
			taskKeyEmptyOption: "(None)",
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

	noteReview: {
		command: {
			current: "Generate Note Summary",
			menu: "Note Summary",
		},
		modal: {
			title: "Note Summary",
			manualDescription: "LLM is not configured, so automatic generation is unavailable. Review the note body and enter the key points manually at a level that will be useful for later reflection.",
			summaryLabel: "Summary",
			save: "Save",
			regenerate: "Regenerate",
		},
		notice: {
			saved: "Note summary saved",
			failed: "Failed to generate note summary",
			noActiveNote: "No active note",
			apiKeyNotSet: "LLM API key is not configured",
		},
	},

	projectIndex: {
		section: {
			noteUpdateHistory: {
				title: "Note Update History",
			},
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
			trend: { title: "Daily Trend" },
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
				line1: "At the start of the morning, create today's task list (pull unfinished tasks → review → push to apply).",
				line2: "During the day, use push to update changes incrementally.",
			},
		},

		reviewpoint: {
			comment: {
				outline: [
					"The following items are reflection materials extracted from today's note summaries.",
					"Merge duplicates, align the level of detail, and add missing context before finalizing the reflection points.",
				],
				manualOutline: [
					"This is a workspace for organizing reflection points manually.",
					"Review the previous \"Daily Report\" section and use any note summaries that are already available.",
					"If a note has no summary yet, open the note body as needed by using its title as the starting point.",
					"Merge duplicates and organize your findings into insights, problems, unresolved items, and next actions.",
				],
				xmind: [
					"[Reflection workflow with XMind]",
					"1. Open the editing XMind file below.",
					"2. Open the input text file below, copy its content, and paste it into XMind.",
					"3. Reorganize the structure, level of detail, and wording in XMind.",
					"4. Paste the organized result back into \"Output (XMind editing result)\".",
				],
				manualXmind: [
					"[Manual reflection workflow]",
					"1. Review the previous \"Daily Report\" section and use any note summaries that are already available.",
					"2. If a note has no summary yet, open the note body as needed by using its title as the starting point.",
					"3. Use the XMind file and input text below to merge duplicates and reorganize the material.",
					"4. Paste the organized result into \"Output (XMind editing result)\" with insights, problems, unresolved items, and next actions.",
				],
			},
			xmindFileLinkLabel: "Open the editing XMind file",
			xmindInputFileLinkLabel: "Open the XMind input text",
			xmindOutputHeading: "Output (XMind editing result)",
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

	reviewFlow: {
		setup: {
			title: "Run Review",
			dateLabel: "Target date",
			taskReviewLabel: "Task review",
			notesReviewLabel: "Daily notes review",
			reviewPointFormatLabel: "Reflection point format",
			run: "Run",
			atLeastOneRequired: "Select at least one review option.",
			options: {
				outline: "outline",
				xmind: "xmind",
			},
		},
		progress: {
			title: "Running Review",
			running: "Running...",
			completed: "Review completed. Closing shortly",
			failed: "An error occurred",
			events: {
				started: "Review started",
				taskReviewStarted: "Task review started",
				taskReviewSkipped: "Task review skipped",
				taskReviewCompleted: "Task review completed",
				notesReviewStarted: "Daily notes review started",
				notesReviewSkipped: "Daily notes review skipped",
				notesReviewProgress: "Generating note summaries",
				notesReviewCompleted: "Daily notes review completed",
			},
		},
	},

	reviewCommand: {
		notice: {
			generated: "Review generated ({taskCount} tasks, notes {noteCount}/{generatedCount})",
			generatedWithoutNotesReview: "Review generated ({taskCount} tasks, notes review skipped: {reason})",
		},
	},

	auth: {
		progress: {
			title: "Running Google Sign-in",
			subtitle: "Complete the browser sign-in flow to continue.",
			statusLabel: "Current status",
			instructionTitle: "What to do",
			hintTitle: "If it looks stuck",
			running: "Continuing authentication in your browser...",
			browserInstruction: "Complete the Google sign-in flow in your browser.",
			backButtonHint: "If the browser looks stuck, going back once and continuing again may allow the sign-in to complete.",
			autoClose: "This dialog closes automatically after authentication completes.",
			completed: "Google sign-in completed. Closing shortly",
			failed: "Google sign-in failed",
			timedOut: "Google sign-in timed out. Check the browser state and try again if needed.",
		},
		notice: {
			loginSucceeded: "Google login successful.",
			loginFailed: "Login failed",
			loginCancelled: "Stopped waiting for Google sign-in.",
			loginTimedOut: "Google sign-in timed out. Check the browser state and try again if needed.",
			authenticated: "Authenticated",
			authenticatedWithEmail: "Authenticated",
			notAuthenticated: "Not authenticated. Please login.",
		},
	},

	push: {
		notice: {
			cancelled: "Push cancelled.",
			blockedByDiff: "Push blocked by diff ({count} errors)",
			completed: "Push and rebuild completed.",
			details: {
				summaryTitle: "=== Summary ===",
				errorsTitle: "=== Errors ===",
				warningsTitle: "=== Warnings ===",
				create: "create",
				update: "update",
				delete: "delete",
				errors: "errors",
				warnings: "warnings",
			},
		},
		confirm: {
			planning: {
				title: "Sync with replacement",
				message:
					"Existing daily tasks will be deleted before re-registering. Past completed and unfinished tasks may also be deleted.",
			},
			working: {
				title: "Sync differences",
				message:
					"Differences will be added or updated. No deletions will be sent.",
			},
			summary: {
				create: "Create",
				update: "Update",
				delete: "Delete",
			},
		},
	},

	setup: {
		command: {
			open: "Open Setup Wizard",
		},
		title: "Setup Checklist",
		refresh: "Refresh",
		refreshDesc: "Reload the current setup status.",
		requiredSection: "Required",
		recommendedSection: "Recommended",
		requiredSectionDesc: "If an item is not configured, open the manual link and complete the setup.",
		recommendedSectionDesc: "See the following manual for recommended plugin setup.",
		recommendedSectionGuideUrl: "https://ptune.getperf.net/ptune-task/setup/recommended-plugins/",
		manualLinkLabel: "Manual link",
		openGuide: "Open guide",
		status: {
			ok: "OK",
			missing: "Missing",
			warning: "Check",
			skipped: "Skipped",
		},
		items: {
			noteResources: "Note folders",
			dailyNotes: "Daily Notes",
			ptunesync: "PtuneSync",
			calendar: "Calendar",
			outliner: "Outliner",
			bases: "Bases",
		},
		messages: {
			missingPrefix: "Missing",
			noteResourcesReady: "Project folders are ready.",
			dailyNotesPluginMissing: "Enable the Daily Notes core plugin.",
			dailyNotesConfigMissing: "daily-notes.json was not found under the vault config directory.",
			dailyNotesReady: "Daily Notes is enabled. Folder: {folder}",
			dailyNotesFolderMissing: "The folder is not configured.",
			ptunesyncSkipped: "PtuneSync is only required on Windows.",
			ptunesyncReady: "PtuneSync responded to auth-status.",
			ptunesyncMissing: "PtuneSync auth-status did not succeed",
			recommendedEnabled: "Enabled.",
			recommendedMissing: "Recommended but not enabled.",
		},
		noteResources: {
			title: "Note folders",
			statusTitle: "Status",
			desc: "Create _project and _journal.",
			run: "Initialize",
			completed: "Updated note folders.",
		},
	},
} as const;
