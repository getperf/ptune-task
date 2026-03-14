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
		},

		notice: {
			titleRequired: "タイトルが未入力です",
			invalidTitle: "タイトルに無効な文字があります",
			projectFolderCreated: "プロジェクトフォルダを作成しました",
			projectNoteCreated: "ノートを作成しました",
			createFailed: "作成に失敗しました",
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
			memo: { title: "振り返りメモ" },
			tags: { title: "タグ一覧（当日生成）" },
			unregistered: { title: "未登録タグ候補（要レビュー）" },
			report: { title: "デイリーレポート" },
			reviewpoint: { title: "振り返りポイント" },
		},

		planned: {
			comment: {
				line1: "作業開始時に1日のタスクリストを記入してください。",
				line2: "記入後、エクスポートコマンドで Google Tasks 経由で ptune スマホアプリと連携します",
			},
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
} as const;
