// src/shared/i18n/settings/ja.ts

export const settingsJa = {
	basic: {
		heading: "基本設定",

		syncBackend: {
			name: "同期バックエンド",
			desc: "移行期間中に使用する PtuneSync バックエンドを選択します",
			options: {
				"ptune-task": "PtuneSync（新）",
				"ptune-sync-skel": "ptune-sync-skel（旧）",
			},
		},

		logLevel: {
			name: "ログレベル",
			desc: "ログの出力レベルを指定します",
			options: {
				debug: "デバッグ",
				info: "情報",
				warn: "警告",
				error: "エラー",
				none: "出力しない",
			},
		},

		enableLogFile: {
			name: "ログファイル出力",
			desc: "ログをファイルに保存します",
		},
	},

	llm: {
		sectionTitle: "LLM 設定",

		provider: {
			name: "プロバイダー",
			desc: "要約生成に使う LLM プロバイダー",
			options: {
				openai: "OpenAI",
				claude: "Claude",
				gemini: "Gemini",
				custom: "Custom",
			},
		},

		apiKey: {
			name: "API キー",
			desc: "LLM API キー",
			placeholder: "sk-...",
		},

		baseUrl: {
			name: "Base URL",
			desc: "API のベース URL",
			placeholder: "https://api.openai.com/v1",
		},

		model: {
			name: "モデル",
			desc: "要約に使うモデル名",
			placeholder: "gpt-5-mini",
		},

		temperature: {
			name: "Temperature",
			desc: "要約生成のゆらぎ",
		},

		maxTokens: {
			name: "Max Tokens",
			desc: "要約生成の最大トークン数",
			placeholder: "1200",
		},
	},

	note: {
		sectionTitle: "ノート設定",

		folderPrefix: {
			name: "フォルダ接頭辞",
			desc: "プロジェクト／日誌フォルダ名の付与方式",
			options: {
				serial: "連番",
				date: "日付",
			},
		},

		notePrefix: {
			name: "ノート接頭辞",
			desc: "ノートファイル名の付与方式",
			options: {
				serial: "連番",
				date: "日付",
			},
		},

		prefixDigits: {
			name: "連番の桁数",
			desc: "連番指定時のゼロ埋め桁数",
		},

		template: {
			name: "テンプレートファイル",
			desc: "新規ノート作成時に使用するテンプレート",
			placeholder: "_templates/note/default.md",
		},
	},

	projectIndex: {
		sectionTitle: "プロジェクトインデックス設定",

		enableBasesSection: {
			name: "Bases セクションを有効にする",
			desc: "Bases プラグインが有効なとき、プロジェクトの index.md に Bases ビュー用セクションを追加・補完します",
		},
	},

	review: {
		sectionTitle: "レビュー設定",

		notesReviewEnabledDefault: {
			name: "当日作成ノートレビュー",
			desc: "レビューコマンド実行時の既定で、当日作成ノートレビューを有効にします",
		},

		reviewPointOutputFormat: {
			name: "振り返りポイント形式",
			desc: "当日作成ノートレビュー内の振り返りポイントの既定出力形式",
			options: {
				outline: "outline",
				xmind: "xmind",
			},
		},

		reviewTrendDays: {
			name: "レビュー傾向の日数",
			desc: "日次傾向テーブルに含める過去日数です（1〜30）。既定は7日です",
			placeholder: "7",
		},

		xmindTemplatePath: {
			name: "XMind テンプレートパス",
			desc: "振り返りポイントの XMind テンプレートとして使う vault 相対パス",
			placeholder: "_template/xmind/template_analysis.xmind",
		},
	},

	dailyNoteTask: {
		sectionTitle: "日次タスク設定",

		templateManager: {
			name: "テンプレート",
			desc: "テンプレートを選んで、日次タスク設定へ適用またはクリアします",
			open: "テンプレートを開く",
			options: {
				"software-development": "ソフト開発",
			},
			modal: {
				title: "日次タスクテンプレート",
				desc: "現在の Daily Note task 設定を上書きします。適用前にテンプレートを選択してください。",
				includeHabit: {
					name: "Habit タスクも更新する",
					desc: "有効にすると、朝のタスクを「<朝>起床🚫」、夜のタスクを「<夜>就寝🚫」へ更新します",
				},
				template: {
					name: "タスクテンプレート",
					desc: "適用するテンプレートを選択します",
				},
				apply: "適用",
				clear: "クリア",
			},
			notice: {
				applied: "日次タスクテンプレートを適用しました",
				cleared: "日次タスク設定をクリアしました",
			},
		},

		habit: {
			morning: {
				name: "朝のタスク",
				desc: "毎朝確認・実行するタスクを改行区切りで入力します",
				placeholder: "<朝>起床🚫",
			},

			evening: {
				name: "夜のタスク",
				desc: "毎晩確認・実行するタスクを改行区切りで入力します",
				placeholder: "<夜>就寝🚫",
			},
		},

		tagSuggestions: {
			name: "タグ候補",
			desc: "タスク入力時のコード補完候補リスト（改行区切り）",
			placeholder: "",
		},

		goalSuggestions: {
			name: "ゴール候補",
			desc: "タスク完了目標のコード補完候補リスト（改行区切り）",
			placeholder: "",
		},

		subTaskTemplates: {
			name: "サブタスクテンプレート",
			desc: "サブタスク入力時のコード補完候補リスト（改行区切り）",
			placeholder: "",
		},
	},

	snippet: {
		sectionTitle: "スニペット設定",

		snippetFile: {
			name: "スニペットファイル",
			desc: "登録済みスニペット定義ファイルのパス",
			placeholder: "_snippets/snippets.md",
		},
	},
} as const;
