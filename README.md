# ptune-task

## Overview / 概要

**English**  
**ptune-task** is an Obsidian plugin for daily task planning, Google Tasks synchronization, and end-of-day review around Daily Notes.  
It is designed for a desktop workflow centered on Obsidian, Daily Notes, and the external **PtuneSync** companion app.

**日本語**  
**ptune-task** は、Obsidian Daily Notes を中心に日次タスク計画、Google Tasks 同期、日次振り返りを支援するプラグインです。  
Obsidian、Daily Notes、外部アプリ **PtuneSync** を組み合わせたデスクトップ運用を前提にしています。

---

## What It Does / 主な機能

**English**
- Plan and edit today's tasks in Obsidian Daily Notes
- Pull unfinished tasks into today's note
- Push task updates to Google Tasks through PtuneSync
- Rebuild daily task sections after synchronization
- Generate daily review content from task data
- Optionally generate note summaries and reflection points

**日本語**
- Obsidian Daily Note 上で今日の予定タスクを計画・編集
- 未完了タスクを当日のノートへ取り込み
- PtuneSync 経由で Google Tasks へ Push
- 同期後に日次タスクセクションを再構築
- タスク実績から日次振り返りを生成
- 必要に応じてノート要約や振り返りポイントを生成

---

## Requirements / 前提条件

**English**
- Obsidian Desktop
- Windows environment for Google Tasks synchronization
- Daily Notes core plugin enabled
- PtuneSync installed if you want sync features
- Google account authentication if you want Google Tasks sync

**日本語**
- Obsidian デスクトップ版
- Google Tasks 同期を使う場合は Windows 環境
- Daily Notes コアプラグインの有効化
- 同期機能を使う場合は PtuneSync の導入
- Google Tasks 同期を使う場合は Google アカウント認証

---

## Setup / セットアップ

**English**  
Full setup guides and detailed documentation are available on the official site:

👉 https://ptune.getperf.net/en/

Main setup topics:
- Daily Notes setup
- PtuneSync installation and authentication
- Recommended companion plugins

**日本語**  
セットアップ手順や詳細な使い方は公式サイトを参照してください：

👉 https://ptune.getperf.net/

主なセットアップ内容:
- Daily Notes の設定
- PtuneSync の導入と認証
- 推奨プラグインの導入

---

## Compatibility / 対応環境

**English**
- Obsidian Desktop only
- `isDesktopOnly: true`
- Windows is required for PtuneSync-based sync
- Non-Windows environments may still use non-sync parts of the plugin, but the main supported workflow is Windows desktop

**日本語**
- Obsidian デスクトップ版のみ対応
- `isDesktopOnly: true`
- PtuneSync ベースの同期には Windows が必要
- 非 Windows 環境でも一部機能は利用できますが、主なサポート対象は Windows デスクトップ運用です

---

## Disclosures / Disclosure

**English**
- **External app dependency:** Google Tasks sync uses the external companion app **PtuneSync**
- **Account requirement:** Google Tasks sync requires a Google account
- **Network use:** Sync and optional LLM features communicate with external services
- **Optional AI integration:** Note summary and reflection workflows can use user-configured LLM APIs
- **Optional external event hook:** An event hook for `ptune-log` integration exists, but it is disabled by default
- **Storage scope:** The plugin writes notes and generated resources inside the Obsidian vault and plugin-managed work areas
- **Telemetry:** No telemetry is included

**日本語**
- **外部アプリ依存:** Google Tasks 同期には外部 companion app の **PtuneSync** を使用します
- **アカウント要件:** Google Tasks 同期には Google アカウントが必要です
- **ネットワーク利用:** 同期機能および任意の LLM 機能は外部サービスと通信します
- **任意の AI 連携:** ノート要約や振り返りでは、ユーザー設定の LLM API を利用できます
- **任意の外部イベントフック:** `ptune-log` 連携用 event hook がありますが、既定では無効です
- **保存範囲:** ノートおよび生成リソースは Obsidian vault 内と plugin 管理下の作業領域に保存されます
- **Telemetry:** テレメトリは含みません

---

## Project Scope / 位置づけ

**English**  
The ptune ecosystem is being split into two complementary tools:

- **ptune-task**: task-centered daily planning, synchronization, and review
- **ptune-log**: work-log organization, knowledge capture, and continuous improvement

`ptune-task` focuses on stable daily task operations around Obsidian, Google Tasks, and PtuneSync.

**日本語**  
ptune は今後、役割の異なる 2 つのツールへ分離していきます。

- **ptune-task**: 日次のタスク管理、同期、振り返り
- **ptune-log**: 作業ログ整理、知識蓄積、継続的改善

`ptune-task` は Obsidian・Google Tasks・PtuneSync を中心とした安定的なタスク運用を重視します。

---

## License / ライセンス

**English**  
MIT License

**日本語**  
MIT ライセンス

---

## Issues / フィードバック

**English**  
Please submit issues and feature requests via GitHub.

**日本語**  
不具合報告や改善要望は GitHub Issues へお願いします。
