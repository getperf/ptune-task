# ptune-log event hook

## 方針

`ptune-task` は新 `ptune-log` のイベント送信、外部起動、状態監視だけを担当する。
旧 `codex-md-export` の interop と CLI 互換は維持しない。

## ファイル連携

既定ルートは `~/.ptune/interop` とし、以下へ直接入出力する。

- event: `inbox/<request-id>.json`
- status: `status/<request-id>.json`
- notification: `notifications/outbox/<batch-id>.json`
- daemon lock: `~/.ptune/runtime/daemon.lock`

`old` / `new` / `both` の送信モードと `interop-dev` への複製は廃止する。

## daemon 管理

`ptune-task` は設定された新 `ptune-log` の `python.exe` から次を実行する。

- 状態確認: `-m ptune_log.main daemon status --json`
- 手動起動: `-m ptune_log.main daemon start --open-ui`
- 停止: `-m ptune_log.main daemon stop`
- 手動再起動: `-m ptune_log.main daemon restart --open-ui`
- startup/event ensure: `-m ptune_log.main daemon start --no-open-ui`

startup/event ensureはlockのmtimeだけに依存せず、古いlockでは `daemon status --json` を確認する。
起動競合で `start` が失敗した場合も、statusがrunningならensure成功として扱う。

設定ファイルは `ptune-log` が、モジュールホーム、`~/.ptune/config/ptune-log.toml` の順に探索する。
両方に存在しない場合、daemon restart 時に既定構成をユーザー設定へ生成する。
生成後の設定編集と将来の設定UIは `ptune-log` の責務とする。
