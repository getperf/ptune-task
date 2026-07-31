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
		pullToday: "Pull today",
		pushToday: "Push today",
		dailyReview: "Generate daily review",
		login: "Login",
		authStatus: "Auth status",
	},

	pull: {
		notice: {
			createdAndPulled: "Daily note created and pulled.",
			completed: "Pull completed.",
		},
	},

	noteCreation: {
		menu: {
			createProjectFolder: "Create project folder",
			createProjectNote: "Create note",
		},

		modal: {
			projectFolderTitle: "Create project folder",
			projectNoteTitle: "Create note",
			targetLabel: "Target folder",
			taskKeyLabel: "Select task",
			taskKeyEmptyOption: "(none)",
			titleLabel: "Title",
			titlePlaceholder: "Enter title",
			ptuneLogHookLabel: "Enable ptune-log hook",
			ptuneLogHookDesc:
				"When off, no ptune-log integration event is sent after note creation.",
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
			current: "Generate note summary",
			menu: "Note summary",
			hookMenu: "Reconnect transcript capture",
		},
		progress: {
			title: "Note summary",
			processing: "Generating summary…",
			seeLog: "See the ptune-log log for details.",
		},
		notice: {
			failed: "Failed to generate note summary",
			noActiveNote: "No active note",
			reviewRequestedTimeout:
				"Accepted the note summary review request. Check whether the review GUI opens.",
			nonWorkNote:
				"Not a work note (no `dailynote`); no ptune-log event was sent.",
			eventHookDisabled:
				"The ptune-log event hook is disabled. Enable it in settings.",
			reviewCompleted: "Summary generated",
			reviewAlreadySummarized: "Already summarized; skipped",
			reviewGenerateFailed: "Failed to generate summary",
			reviewWaitTimeout: "Timed out waiting for the completion notification",
		},
	},

	eventHook: {
		notice: {
			success: "Event sent",
			skipped: "Event skipped",
			timeout: "The ptune-log daemon is not running or not responding",
			errorPrefix: "Event hook failed",
		},
	},

	projectIndex: {
		section: {
			noteUpdateHistory: {
				title: "Note update history",
			},
		},
	},

	daily: {
		section: {
			planned: { title: "Planned tasks" },
			timelog: { title: "Time log / notes" },
			review: { title: "Task review" },
			timetable: { title: "Time table" },
			unfinished: { title: "Unfinished tasks" },
			timeanalysis: { title: "Time analysis" },
			trend: { title: "Daily trend" },
			memo: { title: "Reflection memo" },
			tags: { title: "Tag list (generated today)" },
			unregistered: {
				title: "Unregistered tag candidates (review required)",
			},
			report: { title: "Daily report" },
			reviewpoint: { title: "Reflection points" },
		},

		planned: {
			comment: {
				line1: "At the start of the morning, create today's task list (pull unfinished tasks → review → push to apply).",
				line2: "During the day, use push to update changes incrementally.",
				line3: "Note: tasks with the same title under the same parent cannot be synced. Add a qualifier to make each title unique.",
			},
			error: {
				duplicateName:
					"Duplicate planned task name: {taskKey}\nTasks with the same title under the same parent cannot be synced. Rename one of them.",
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
					'Review the previous "daily report" section and use any note summaries that are already available.',
					"If a note has no summary yet, open the note body as needed by using its title as the starting point.",
					"Merge duplicates and organize your findings into insights, problems, unresolved items, and next actions.",
				],
				xmind: [
					"Reflection workflow for the mind map:",
					"1. Open the editing mind map file below with XMind 8.",
					"2. The fact section is generated from today's note summary sentences.",
					"3. Additional topics from the mind map outline template are generated after fact.",
					"4. Reorganize the structure, level of detail, and wording in the mind map file.",
					"5. Paste the organized result back into the output section if needed.",
					"Note: the generated file targets the XMind 8 format.",
				],
				manualXmind: [
					"Manual reflection workflow:",
					'1. Review the previous "daily report" section and use any note summaries that are already available.',
					"2. If a note has no summary yet, open the note body as needed by using its title as the starting point.",
					"3. Open the mind map file below with XMind 8, then merge duplicates and reorganize the material.",
					"4. Paste the organized result into the output section with insights, problems, unresolved items, and next actions.",
					"Note: the generated file targets the XMind 8 format.",
				],
				logseq: [
					"Logseq reflection workflow:",
					"1. Open the generated Logseq journal below.",
					"2. Review and enrich the journal content in Logseq.",
					"3. Return to this note when done.",
				],
			},
			xmindFileLinkLabel: "Open the editing mind map file",
			xmindInputFileLinkLabel: "Open the mind map input text",
			logseqJournalLinkLabel: "Open the generated Logseq journal",
			xmindOutputHeading: "Output (mind map editing result)",
		},
	},

	review: {
		flag: {
			operationMiss: "Operation miss",
			toolOrEnvIssue: "Environment issue",
			decisionPending: "Pending",
			scopeExpanded: "Scope expanded",
			unresolved: "Unresolved",
			newIssueFound: "New issue",
			unknown: "Unknown",
		},
	},

	reviewFlow: {
		setup: {
			title: "Run review",
			dateLabel: "Target date",
			taskReviewLabel: "Task review",
			notesReviewLabel: "Daily notes review",
			reviewPointFormatLabel: "Reflection point format",
			run: "Run",
			atLeastOneRequired: "Select at least one review option.",
			notesReviewRequiresEventHook:
				"Daily notes review requires enabling the ptune-log event hook.",
			options: {
				outline: "Text outline",
				xmind: "Mind map",
				logseq: "Logseq",
			},
		},
		progress: {
			title: "Running review",
			running: "Running...",
			continueInBackground: "Continue in background",
			actionHint:
				"Continue in background closes this dialog while the review keeps running. Cancel stops the daily review currently in progress.",
			cancelConfirmationTitle: "Stop the daily review?",
			cancelConfirmationMessage: "The daily review currently in progress will be stopped.",
			stopReview: "Stop review",
			completed: "Review completed. Closing shortly",
			failed: "An error occurred",
			events: {
				started: "Review started",
				taskReviewStarted: "Task review started",
				taskReviewSkipped: "Task review skipped",
				taskReviewCompleted: "Task review completed",
				notesReviewStarted: "Daily notes review started",
				notesReviewSkipped: "Daily notes review skipped",
				notesReviewCompleted: "Daily notes review completed",
				externalReviewRequested: "Requested external review",
				externalReviewAccepted: "Review UI accepted",
				externalReviewStatusTimeout:
					"Launch acknowledgement timed out. Continue waiting for apply notification.",
				externalReviewWaiting:
					"Waiting for review completion notification",
				externalReviewApplyTimeout:
					"Timed out while waiting for review completion notification",
				externalReviewApplied:
					"Received review completion notification",
				taskReviewParallelStart: "Starting task review in parallel",
				dailyNotesReviewAfterExternal:
					"Starting daily notes aggregation after external review completion",
			},
		},
	},

	reviewCommand: {
		notice: {
			generated:
				"Review generated ({taskCount} tasks, notes {noteCount})",
			generatedWithoutNotesReview:
				"Review generated ({taskCount} tasks, notes review skipped: {reason})",
			dailyNotesReviewRequested:
				"Review generated ({taskCount} tasks). Requested daily notes review from ptune-log.",
			generatedTaskOnlyEventHookDisabled:
				"Task review generated ({taskCount} tasks). Daily notes review requires enabling the ptune-log event hook.",
			dailyNotesReviewFailed:
				"Review generated ({taskCount} tasks). Daily notes review failed.",
			dailyNotesReviewTimeout:
				"Review generated ({taskCount} tasks). Timed out waiting for daily notes review completion.",
		},
	},

	auth: {
		progress: {
			title: "Google sign-in in progress",
			subtitle: "Complete the browser sign-in flow to continue.",
			statusLabel: "Current status",
			instructionTitle: "What to do",
			hintTitle: "If it looks stuck",
			running: "Continuing authentication in your browser...",
			browserInstruction: "Finish sign-in in your browser.",
			backButtonHint:
				"If the browser looks stuck, going back once and continuing again may allow the sign-in to complete.",
			autoClose:
				"This dialog closes automatically after authentication completes.",
			completed: "Google sign-in completed. Closing shortly",
			failed: "Google sign-in failed",
			timedOut:
				"Google sign-in timed out. Check the browser state and try again if needed.",
		},
		notice: {
			loginSucceeded: "Google login successful.",
			loginFailed: "Login failed",
			loginCancelled: "No longer waiting for sign-in.",
			loginTimedOut:
				"Google sign-in timed out. Check the browser state and try again if needed.",
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
				summaryTitle: "=== summary ===",
				errorsTitle: "=== errors ===",
				warningsTitle: "=== warnings ===",
				create: "Create",
				update: "Update",
				delete: "Delete",
				errors: "Errors",
				warnings: "Warnings",
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
			open: "Open setup wizard",
		},
		title: "Setup checklist",
		refresh: "Refresh",
		refreshDesc: "Reload the current setup status.",
		requiredSection: "Required",
		recommendedSection: "Recommended",
		requiredSectionDesc:
			"If an item is not configured, open the manual link and complete the setup.",
		recommendedSectionDesc:
			"See the following manual for recommended plugin setup.",
		recommendedSectionGuideUrl:
			"https://ptune.getperf.net/ptune-task/setup/recommended-plugins/",
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
			dailyNotes: "Daily notes",
			ptunesync: "PtuneSync",
			calendar: "Calendar",
			outliner: "Outliner",
			bases: "Bases",
		},
		messages: {
			missingPrefix: "Missing",
			noteResourcesReady: "Project folders are ready.",
			dailyNotesPluginMissing: "Enable the daily notes core plugin.",
			dailyNotesConfigMissing:
				"The file daily-notes.json was not found under the vault config directory.",
			dailyNotesReady: "Daily notes is enabled. Folder: {folder}",
			dailyNotesFolderMissing: "The folder is not configured.",
			ptunesyncSkipped: "PtuneSync is only required on Windows.",
			ptunesyncReady: "PtuneSync responded to auth-status.",
			ptunesyncMissing: "PtuneSync auth-status did not succeed",
			recommendedEnabled: "Enabled.",
			recommendedMissing: "Recommended but not enabled.",
			startupNoticeRequiredMissing:
				"Required setup items are incomplete. Open setup check to review.",
		},
		noteResources: {
			title: "Note folders",
			statusTitle: "Status",
			desc: "Create _project, _journal, _template, and _template/note.",
			run: "Initialize",
			completed: "Updated note folders.",
		},
	},
} as const;
