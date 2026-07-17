export const commonJa = {
	language: {
		name: "言語",
		desc: "UI 表示に使用する言語",
		options: {
			ja: "日本語",
			en: "英語",
		},
	},

	notice: {
		apiKeyNotSet: "⚠️ APIキー未設定",
		failed: "処理に失敗しました",
	},

	action: {
		create: "作成",
		confirm: "実行する",
		cancel: "キャンセル",
		close: "閉じる",
	},

	commands: {
		pullToday: "今日の予定を Pull",
		pushToday: "今日の予定を Push",
		dailyReview: "今日の振り返り Review",
		login: "ログイン認証",
		authStatus: "認証ステータス",
	},

	pull: {
		notice: {
			createdAndPulled: "デイリーノートを作成して Pull しました",
			completed: "Pull が完了しました",
		},
	},

	noteCreation: {
		menu: {
			createProjectFolder: "プロジェクトフォルダ作成",
			createProjectNote: "ノート作成",
		},

		modal: {
			projectFolderTitle: "プロジェクトフォルダ作成",
			projectNoteTitle: "ノート作成",
			targetLabel: "対象フォルダ",
			taskKeyLabel: "タスクを選択",
			taskKeyEmptyOption: "(選択なし)",
			titleLabel: "タイトル",
			titlePlaceholder: "タイトルを入力",
			ptuneLogHookLabel: "ptune-log フックを有効にする",
			ptuneLogHookDesc:
				"OFF の場合、ノート作成時に ptune-log 連携イベントを送信しません。",
		},

		notice: {
			titleRequired: "タイトルが未入力です",
			invalidTitle: "タイトルに無効な文字があります",
			projectFolderCreated: "プロジェクトフォルダを作成しました",
			projectNoteCreated: "ノートを作成しました",
			createFailed: "作成に失敗しました",
		},
	},

	noteReview: {
		command: {
			current: "ノート要約を生成",
			menu: "ノート要約",
			hookMenu: "Transcript キャプチャー再接続",
		},
		progress: {
			title: "ノート要約",
			processing: "要約を生成中…",
			seeLog: "詳細は ptune-log ログを参照してください。",
		},
		notice: {
			failed: "ノート要約の生成に失敗しました",
			noActiveNote: "アクティブなノートがありません",
			reviewRequestedTimeout:
				"ノート要約レビュー依頼を受け付けました。GUI 起動を確認してください",
			nonWorkNote:
				"作業ノート（dailynote）ではないため、ptune-log イベントは送信しません",
			eventHookDisabled:
				"ptune-log イベントフックが無効です。設定で有効化してください",
			reviewCompleted: "要約を生成しました",
			reviewAlreadySummarized: "既に要約済みのためスキップしました",
			reviewGenerateFailed: "要約生成に失敗しました",
			reviewWaitTimeout: "完了通知の待機がタイムアウトしました",
		},
	},

	eventHook: {
		notice: {
			success: "イベントを送信しました",
			skipped: "イベントをスキップしました",
			timeout: "ptune-log のデーモンが起動していないか、応答がありません",
			errorPrefix: "イベントフックに失敗しました",
		},
	},

	projectIndex: {
		section: {
			noteUpdateHistory: {
				title: "ノート更新履歴",
			},
		},
	},

	daily: {
		section: {
			planned: { title: "今日の予定タスク" },
			timelog: { title: "タイムログ／メモ" },
			review: { title: "タスク振り返り" },
			timetable: { title: "タイムテーブル" },
			unfinished: { title: "未完了タスク" },
			timeanalysis: { title: "時間分析" },
			trend: { title: "日次傾向" },
			memo: { title: "振り返りメモ" },
			tags: { title: "タグ一覧（当日生成）" },
			unregistered: { title: "未登録タグ候補（要レビュー）" },
			report: { title: "デイリーレポート" },
			reviewpoint: { title: "振り返りポイント" },
		},

		planned: {
			comment: {
				line1: "作業開始時に1日のタスクリストを記入してください。朝の開始時に予定タスクを作成（pullで未完了を取り込み→整理→pushで反映）。",
				line2: "日中の追加・変更はpushで差分更新します。",
				line3: "注意: 同じ親タスクの下に同名タスクを複数作ると同期できません。必要に応じて名前に補足を付けてください。",
			},
			error: {
				duplicateName:
					"同じ名前の予定タスクがあります: {taskKey}\n同じ親タスクの下では、同名タスクを同期できません。片方の名前を変更してください。",
			},
		},

		reviewpoint: {
			comment: {
				outline: [
					"下記は当日のノート要約から抽出した振り返り素材です。",
					"重複を整理し、粒度をそろえ、必要な補足を追記して振り返りポイントとして整えてください。",
				],
				manualOutline: [
					"下記は手動で振り返りポイントを整理するための作業エリアです。",
					"前の「デイリーレポート」を確認し、要約があるノートはその内容を使ってください。",
					"要約がないノートは、タイトルを手掛かりに必要なノート本文を開いて確認してください。",
					"重複をまとめ、気づき・問題・未解決事項・次回対応を整理して追記してください。",
				],
				xmind: [
					"[XMind による振り返り手順]",
					"1. 次の編集用 XMind ファイルを XMind 8 で開いてください。",
					"2. Fact 配下は当日のノート要約から自動生成されています。",
					"3. KPT などの追加トピックは XMind アウトラインテンプレートから生成されています。",
					"4. XMind 上で構造、粒度、表現を整理してください。",
					"5. 必要に応じて整理した結果を「アウトプット（XMind 編集結果）」に貼り戻してください。",
					"注意: 生成ファイルは XMind 8 形式を前提にしています。",
				],
				manualXmind: [
					"[手動による振り返り手順]",
					"1. 前の「デイリーレポート」を確認し、要約があるノートはその内容を使ってください。",
					"2. 要約がないノートは、タイトルを手掛かりに必要なノート本文を開いて確認してください。",
					"3. 下の XMind ファイルを XMind 8 で開き、重複をまとめて整理してください。",
					"4. 気づき・問題・未解決事項・次回対応に整理した結果を「アウトプット（XMind 編集結果）」へ貼り戻してください。",
					"注意: 生成ファイルは XMind 8 形式を前提にしています。",
				],
			},
			logseq: [
				"Logseq 振り返り手順:",
				"1. 下の Logseq 日誌を開いてください。",
				"2. Logseq で内容を確認・追記してください。",
				"3. 完了後にこのノートへ戻ってください。",
			],
			xmindFileLinkLabel: "編集用 XMind ファイルを開く",
			xmindInputFileLinkLabel: "XMind インプットテキストを開く",
			logseqJournalLinkLabel: "Logseq で日誌を開く",
			xmindOutputHeading: "アウトプット（XMind 編集結果）",
		},
	},

	review: {
		flag: {
			operationMiss: "止め忘れ",
			toolOrEnvIssue: "環境問題",
			decisionPending: "未解決",
			scopeExpanded: "難問",
			unresolved: "残件あり",
			newIssueFound: "新たな課題",
			unknown: "不明",
		},
	},

	reviewFlow: {
		setup: {
			title: "レビューを実行",
			dateLabel: "対象日",
			taskReviewLabel: "タスクレビュー",
			notesReviewLabel: "当日作成ノートレビュー",
			reviewPointFormatLabel: "振り返りポイント形式",
			run: "実行",
			atLeastOneRequired: "少なくとも1つのレビューを選択してください",
			notesReviewRequiresEventHook:
				"当日作成ノートレビューには ptune-log イベントフックの有効化が必要です",
			options: {
				outline: "outline",
				xmind: "xmind",
				logseq: "logseq",
			},
		},
		progress: {
			title: "レビュー実行中",
			running: "実行中...",
			completed: "レビューが完了しました。まもなく閉じます",
			failed: "エラーが発生しました",
			events: {
				started: "レビューを開始しました",
				taskReviewStarted: "タスクレビューを開始しました",
				taskReviewSkipped: "タスクレビューをスキップしました",
				taskReviewCompleted: "タスクレビューが完了しました",
				notesReviewStarted: "当日作成ノートレビューを開始しました",
				notesReviewSkipped: "当日作成ノートレビューをスキップしました",
				notesReviewCompleted: "当日作成ノートレビューが完了しました",
				externalReviewRequested: "Python 側レビューを依頼しました",
				externalReviewAccepted: "レビュー UI 起動を確認しました",
				externalReviewStatusTimeout:
					"起動応答がタイムアウトしました。完了通知の待機を継続します",
				externalReviewWaiting: "レビュー UI の完了通知を待機しています",
				externalReviewApplyTimeout:
					"レビュー完了通知の待機がタイムアウトしました",
				externalReviewApplied: "レビュー完了通知を受信しました",
				taskReviewParallelStart: "タスクレビューを先行実行します",
				dailyNotesReviewAfterExternal:
					"外部レビュー完了後にデイリーレポート集計を開始します",
			},
		},
	},

	reviewCommand: {
		notice: {
			generated:
				"レビューを生成しました（タスク {taskCount} 件、ノート {noteCount} 件）",
			generatedWithoutNotesReview:
				"レビューを生成しました（タスク {taskCount} 件、ノートレビューはスキップ: {reason}）",
			dailyNotesReviewRequested:
				"レビューを生成しました（タスク {taskCount} 件）。当日作成ノートレビューを ptune-log に依頼しました。",
			generatedTaskOnlyEventHookDisabled:
				"タスクレビューを生成しました（{taskCount} 件）。当日作成ノートレビューには ptune-log イベントフックの有効化が必要です。",
			dailyNotesReviewFailed:
				"レビューを生成しました（タスク {taskCount} 件）。当日作成ノートレビューは失敗しました。",
			dailyNotesReviewTimeout:
				"レビューを生成しました（タスク {taskCount} 件）。当日作成ノートレビューの完了通知待機がタイムアウトしました。",
		},
	},

	auth: {
		progress: {
			title: "Google 認証を実行中",
			subtitle: "ブラウザでログインを完了してください。",
			statusLabel: "現在の状態",
			instructionTitle: "操作案内",
			hintTitle: "うまく進まない場合",
			running: "ブラウザで認証を進めています...",
			browserInstruction: "ブラウザで Google 認証を完了してください。",
			backButtonHint:
				"反応が止まったように見える場合は、ブラウザの戻るボタンで戻ってから続行すると完了できることがあります。",
			autoClose: "認証が完了するとこの画面は自動で閉じます。",
			completed: "Google 認証が完了しました。まもなく閉じます",
			failed: "Google 認証に失敗しました",
			timedOut:
				"Google 認証がタイムアウトしました。ブラウザの状態を確認して、必要なら再度お試しください。",
		},
		notice: {
			loginSucceeded: "Google 認証が完了しました。",
			loginFailed: "Google 認証に失敗しました",
			loginCancelled: "Google 認証の待機を終了しました。",
			loginTimedOut:
				"Google 認証がタイムアウトしました。ブラウザの状態を確認して、必要なら再度お試しください。",
			authenticated: "認証済みです",
			authenticatedWithEmail: "認証済み",
			notAuthenticated: "未認証です。ログインしてください。",
		},
	},

	push: {
		notice: {
			cancelled: "Push をキャンセルしました",
			blockedByDiff:
				"差分チェックにより Push を中止しました（エラー {count} 件）",
			completed: "Push と再構築が完了しました",
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
				title: "洗い替えで同期します",
				message:
					"既存の当日タスクを削除してから再登録します。過去の完了・未完了タスクも削除対象になります。",
			},
			working: {
				title: "差分を同期します",
				message: "差分を追加または更新します。削除は行いません。",
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
			open: "セットアップ確認",
		},
		title: "セットアップ確認",
		refresh: "更新",
		refreshDesc: "現在の設定状態を再確認します",
		requiredSection: "必須項目",
		recommendedSection: "推奨項目",
		requiredSectionDesc:
			"未設定の項目は、各マニュアルリンクを開いて設定してください。",
		recommendedSectionDesc:
			"推奨プラグインの導入手順は次のマニュアルを参照してください。",
		recommendedSectionGuideUrl:
			"https://ptune.getperf.net/ptune-task/setup/recommended-plugins/",
		manualLinkLabel: "マニュアルリンク",
		openGuide: "案内を開く",
		status: {
			ok: "OK",
			missing: "未設定",
			warning: "要確認",
			skipped: "スキップ",
		},
		items: {
			noteResources: "ノート関連ディレクトリ",
			dailyNotes: "Daily Notes",
			ptunesync: "PtuneSync",
			calendar: "Calendar",
			outliner: "Outliner",
			bases: "Bases",
		},
		messages: {
			missingPrefix: "不足",
			noteResourcesReady:
				"プロジェクト用ディレクトリが準備されています。",
			dailyNotesPluginMissing:
				"Daily Notes コアプラグインを有効化してください。",
			dailyNotesConfigMissing:
				"vault の設定ディレクトリに daily-notes.json が見つかりません。",
			dailyNotesReady: "Daily Notes が有効です。保存先: {folder}",
			dailyNotesFolderMissing: "保存先フォルダが設定されていません。",
			ptunesyncSkipped: "PtuneSync は Windows 環境でのみ必須です。",
			ptunesyncReady: "PtuneSync の auth-status 応答を確認しました。",
			ptunesyncMissing: "PtuneSync の auth-status が成功しませんでした",
			recommendedEnabled: "有効です。",
			recommendedMissing: "推奨ですが有効になっていません。",
			startupNoticeRequiredMissing:
				"必須項目の設定が不完全です。セットアップ確認を開いて確認してください。",
		},
		noteResources: {
			title: "ノート関連ディレクトリ",
			statusTitle: "状態",
			desc: "_project、_journal、_template、および _template/note を作成します。",
			run: "初期化を実行",
			completed: "ノート関連ディレクトリを更新しました",
		},
	},
} as const;
