## Logseq 連携プロトタイプ仕様

### 背景
Obsidian のデイリーノートを起点に、振り返り用の分析素材を Logseq で GUI 編集し、
編集結果を Obsidian デイリーノートへ手動で貼り戻す。
XMind モード運用に近い軽量な連携を目的とし、自動化は開始導線のみに限定する。

### 目的
- デイリーレポートのノート要約リストを Logseq へ取り込む
- ユーザが Logseq 上で箇条書きの移動、分類、追記を行う
- 編集結果を Markdown として Obsidian に保存する
- 実装負荷を抑え、最小構成で運用可能とする

### 構成
#### Obsidian 側
- デイリーノート
- Logseq 連携用テンプレート
- Logseq journal 生成処理
- deeplink 挿入処理
- 貼り付け先セクション

#### Logseq 側
- Obsidian 連携専用 graph
- journals/{YYYY-MM-DD}.md を編集対象とする
- GUI によるアウトライン編集を行う

### ディレクトリ構成
```text
vault/
  _journal/
    YYYY-MM-DD.md
  _review_logseq/
    journals/
      YYYY-MM-DD.md
    pages/
    logseq/
  _templates/
    review-logseq-journal-template.md
````

### 処理概要

#### 1. 入力生成

Obsidian 側で当日用の Logseq journal を生成する。
生成先は `_review_logseq/journals/{YYYY-MM-DD}.md` とする。

#### 2. テンプレート展開

テンプレートに対して以下を埋め込む。

-   日付
-   デイリーレポートのノート要約リスト
-   必要に応じて元ノート参照情報

#### 3. deeplink 作成

Obsidian デイリーノートに、当日 Logseq journal を開くための deeplink を追加する。

#### 4. ユーザ編集

ユーザは Logseq で journal を開き、以下を実施する。

-   箇条書きの移動
-   階層変更
-   グルーピング
-   コメント追記
-   不要項目削除

#### 5. 結果反映

編集完了後、Logseq 上の結果を手動コピーし、
Obsidian デイリーノートの所定セクションへ貼り付ける。

### 入出力方針

#### 入力

-   デイリーレポートのノート要約リスト
-   当日日付
-   テンプレート

#### 中間成果物

-   Logseq journal 用 Markdown

#### 出力

-   Obsidian デイリーノートに貼り付ける Markdown
-   自動貼り戻しは行わない

### 運用方針

-   正本は Obsidian デイリーノートとする
-   Logseq 側ファイルは分析用の作業ファイルとする
-   1日1 journal を原則とする
-   貼り戻しは手動とし、開始導線のみ自動化する

### テンプレート方針

テンプレートは journal 形式で管理し、以下のような分析枠を持つ。

-   今日の振り返り素材

    -   ノート要約一覧
-   分析

    -   着目テーマ
    -   気づき
    -   課題
    -   次のアクション
-   Obsidian貼り付け用

### 注意点

#### graph の扱い

`_review_logseq` は Logseq 専用 graph として利用する。
既存 graph の内側に別 graph を作らない。

#### 保存場所

Logseq graph はローカル保存を前提とする。
クラウド同期ドライブや不安定な外部保存先は避ける。

#### deeplink の前提

deeplink は任意の Markdown ファイル直開きではなく、
Logseq graph 内の journal/page を開く用途として扱う。

#### 貼り戻し方法

貼り戻しは全文コピーでもよいが、
将来的には「貼り付け用セクション」のみを転記する運用に拡張可能とする。

### プロトタイプ範囲

-   Logseq 専用 graph の準備
-   当日 journal の自動生成
-   デイリーノートへの deeplink 追加
-   Logseq での手動分析
-   Obsidian への手動貼り付け

### 非対象

-   編集完了検知
-   自動貼り戻し
-   双方向同期
-   高度なメタデータ変換
-   クラウド連携

### 期待効果

-   XMind に近い軽量な振り返り導線を Markdown ベースで実現できる
-   GUI 編集を Logseq に分離し、Obsidian は保存と参照に集中できる
-   小さな実装で有効性を検証できる
