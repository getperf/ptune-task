export const ja = {
  "daily.section.planned.title": "今日の予定タスク",
  "daily.section.timelog.title": "タイムログ／メモ",
  "daily.section.review.title": "タスク振り返り",
  "daily.section.timetable.title": "タイムテーブル",
  "daily.section.unfinished.title": "未完了タスク",
  "daily.section.timeanalysis.title": "時間分析",
  "daily.section.memo.title": "振り返りメモ",
  "daily.section.tags.title": "タグ一覧（当日生成）",
  "daily.section.unregistered.title": "未登録タグ候補（要レビュー）",
  "daily.section.report.title": "デイリーレポート",
  "daily.section.reviewpoint.title": "振り返りポイント",
  "daily.section.planned.comment.line1":
    "作業開始時に1日のタスクリストを記入してください。",
  "daily.section.planned.comment.line2":
    "記入後、エクスポートコマンドで Google Tasks 経由で ptune スマホアプリと連携します",
  "review.flag.operationMiss": "止め忘れ",
  "review.flag.toolOrEnvIssue": "環境問題",
  "review.flag.decisionPending": "未解決",
  "review.flag.scopeExpanded": "難問",
  "review.flag.unresolved": "残件あり",
  "review.flag.newIssueFound": "新たな課題",
  "review.flag.unknown": "不明",
} as const;

export type I18nKey = keyof typeof ja;