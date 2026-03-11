// src/shared/i18n/settings/ja.ts

export const settingsJa = {
	basic: {
		heading: "基本設定",

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

	snippet: {
		sectionTitle: "スニペット設定",

		snippetFile: {
			name: "スニペットファイル",
			desc: "登録済みスニペット定義ファイルのパス",
			placeholder: "_snippets/snippets.md",
		},
	},
} as const;
