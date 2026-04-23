# ptune-log Event Hook Migration

## 変更点

- 既定の Python 起動モジュールは `-m ptune_log.main` に変わりました。
- 既定の interop ルートは `~/.ptune-log` に変わりました。
- UI 表示名と daemon 名称は `ptune-log` に変わりました。
- 今日の振り返りの当日作成ノートレビューは `daily-review-requested` として ptune-log に依頼します。

## 既存ユーザー向け

- 旧 `~/.codex-md-export` をそのまま使いたい場合は、`Event Hook > Interop ルート` に明示設定してください。
- `python.exe` の絶対パスはそのままでも構いません。`daemonArgs` だけ `-m ptune_log.main daemon --debug` に合わせてください。
- 新しい既定値へ移行する場合は、`Interop ルート` を空欄に戻すと `~/.ptune-log` が使われます。

## 今回の方針

- ptune-task 側では自動移行は行いません。
- 明示設定がある場合はその値を優先します。
- 既定値だけを `ptune-log` に切り替えます。
