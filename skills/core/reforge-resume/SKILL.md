---
name: reforge-resume
description: ナビゲーターモードのエントリポイント。spec.json / questions.json / tasks.json を読み取り、8ステップの固定順序で全フェーズ状態を判定。未解決質問があれば AskUserQuestion でバッチ提示（最大4問）または questions.md にフォールバック。Q&A 専用のマニュアルモードは /reforge-answer。
allowed-tools: Read, Write, Edit, Glob, AskUserQuestion
---

# reforge-resume

このスキルは **ナビゲーターモード** のエントリポイント。質問処理 + フェーズルーティングを兼ねる。
**マニュアルモード**（フェーズ進行を自分で制御するユーザー向け）の Q&A 専用スキルは `/reforge-answer`。両者を混在させると進行マップの一貫性が崩れるため、どちらか一方を選んで運用するのが推奨。

## Core Rule

- Think in English, respond to the user in the language specified by `meta.lang`.
- Treat `.reforge/specs/<name>/spec.json` as the single source of truth for the product specification.
- Do not invent missing product decisions. Convert unknowns into pending questions.
- 1 回のスキル実行で `AskUserQuestion` を呼ぶのは 1 度きり。pending 件数に関係なく常に先頭 4 件までをバッチ提示し、残りは次の実行で処理する（後述「質問機能プロトコル」参照）。
- Keep the skill self-contained. Do not require external prompt files.
- 判定ロジックの順序を変更してはならない（不変条件）。

## Audience and Style (非エンジニア対応)

> **このセクションは全 reforge-* スキル（init / resume / answer / update）で完全に同一のテキストとして共有する正準セクション**。修正は4ファイル同時に適用し、テストで一致を保証する。

このスキルは **IT職企画担当レベルの読者** が直接使えることを想定する（AI-DLC = AI Development Life Cycle における Mob Elaboration = 非エンジニアも含めた集合的要件詰めに、企画職を組み込む方針）。以下を厳守する:

- **専門用語には日本語平易表現を併記する**。これは全節横断のルールとして適用する。例:
  - `Inception 層`（最初に決めること: 誰向け・何のため・何が必要か）
  - `Construction 層`（次に決めること: データ・画面・処理・技術）
  - `Prompt Kernel`（このスキル全体で共通する基本前提）
  - `Output Contract`（実行の終了形式）
  - `Quality Gate`（書き込み前の最終確認）
  - `text`（自由記述） / `single_choice`（ひとつだけ選ぶ） / `multi_choice`（複数選べる） / `multi_input`（複数行の自由記述） / `confirm`（はい・いいえ確認）
  - `slug`（英数字のキー名）
  - `normalized`（表記揺れを揃えた状態）
  - **JSON 記法**: `{}`（空のオブジェクト = 中身がない箱）/ `[]`（空の配列 = 中身がないリスト）/ `""`（空文字 = 中身がない文字列）
  - **`phase` の 9 値**:
    - `meta`（プロダクト全体のメタ情報: 名前・言語など）
    - `audience`（ターゲットユーザー: 誰のためのプロダクトか）
    - `intent`（プロダクトの目的: どんな課題を解決するか）
    - `requirements`（ユーザーストーリー: 何ができるべきか）
    - `data`（エンティティ・データ構造: 何のデータを扱うか）
    - `flows`（ユーザーフロー: 操作の流れ）
    - `views`（画面定義: ユーザーが見る画面）
    - `tech`（技術スタック: 何で作るか）
    - `update`（既存仕様への変更要求: `/reforge-update` 専用）
  - **Lifecycle ステージ語彙**: Output Contract が定義する 6 種類のみ使う:
    - `files_written`（書き込み完了）
    - `questions_batch`（質問をバッチ提示中・AskUserQuestion 経由）
    - `answered`（回答を反映完了）
    - `blocked`（前提が満たされず中断）
    - `complete`（処理完了・変更なし）
- **質問選択肢には必ず「分からない・AI におまかせ」を含める**。tech 質問・enum 選択質問・Inception の選択型質問（`multi_choice` 型など）すべてに適用する。ユーザーが判断できない可能性がある質問では、必ず「分からない」と回答できる経路を確保する。
- 自由記述型（`text` / `multi_input`）の質問でも、ユーザーが「分からない・AI におまかせ」とだけ書ける旨を質問文に注記する。
- 「分からない・AI におまかせ」が選択されたフィールドは `""` または空配列のまま保持し、`/reforge-plan` 以降で AI が推奨値を提案する（ユーザーは再度確認できる）。

### 質問選択肢の供給源

`single_choice` / `multi_choice` / `confirm` 型の質問を AskUserQuestion または questions.md で提示する際、選択肢は以下の優先順位で決定する:

1. **Question Entry の `options` フィールド**（最優先）: pending question に `options: string[]` が設定されていればそのまま使う。これが正準。
2. **SKILL.md のテンプレ表**（フォールバック1）: SKILL.md 内に推奨選択肢が表組みされている場合（例: reforge-init の Tech Field Question Generation の表）はそれを使う。
3. **デフォルトフォールバック**（最低限保証）: 上記いずれも無い場合、最低限「その他（自由記述）」と「分からない・AI におまかせ」の 2 択を含めて提示する。

> 制約: 選択肢を AI が裁量で推測補完してはならない（`no_guessing`）。`options` 未指定で SKILL.md テンプレ表も無い場合は、デフォルトフォールバックの 2 択のみを提示するか、質問エントリを修正して `options` を追加する。

### コマンド表記の統一

- スラッシュコマンドは **必ずハイフン形式** で表記する: `/reforge-init`、`/reforge-resume`、`/reforge-answer`、`/reforge-update`、`/reforge-render`、`/reforge-plan`、`/reforge-impl`、`/reforge-verify`、`/reforge-validate`、`/reforge-diff`。
- 旧コロン形式のスラッシュコマンド表記は使わない（reforge/CLAUDE.md と整合）。

## Canonical Paths

- `REFORGE_DIR = ".reforge"`
- `SPECS_DIR = ".reforge/specs"`
- `SPEC_PATH = ".reforge/specs/<name>/spec.json"` (resolved by Spec Resolution)
- `QUESTIONS_PATH = ".reforge/specs/<name>/questions.json"`
- `TASKS_PATH = ".reforge/specs/<name>/tasks.json"`
- `PREVIOUS_SPEC_PATH = ".reforge/specs/<name>/spec.previous.json"`

## Spec Resolution (reforge-resume [<spec-name>])

引数なし・引数ありの両方に対応する共通ロジック:

1. 引数で spec 名が渡された場合 → `.reforge/specs/<name>/` が存在すれば使用、なければエラー報告して `blocked`。
2. 引数なし + `.reforge/specs/` 内の spec が 1 つ → 自動選択して続行。
3. 引数なし + specs が複数 → 一覧表示して AskUserQuestion で選択を求める。
4. 引数なし + specs が 0 → `/reforge-init "<説明>"` を案内して `blocked`。

選択された spec 名を `<name>` として Canonical Paths を解決する。

## Prompt Kernel

Use this shared kernel for every reforge-engine command.

### Intent

- Convert natural-language intent into a core-compliant Reforge spec lifecycle.
- Preserve human judgment. If a product decision is not explicit, ask instead of deciding.
- Keep the lifecycle visible: intent captured, ambiguity queued, next gate reported.

### Current State

- Read the current workspace state before changing files.
- If `SPEC_PATH` exists, parse it before deciding whether the command may continue.
- If `QUESTIONS_PATH` exists, parse it before adding or removing questions.
- Determine response language from parsed `spec.meta.lang`; if missing or unreadable, use English.

### Constraints

- `no_guessing`: Do not fill fields, flows, views, enum options, required flags, names, roles, or approval rules without evidence.
- `batch_questions`: Present pending questions in batches of up to 4 via `AskUserQuestion`. pending が 5 件以上の場合も先頭 4 件のみを提示し、残りは次の `/reforge-resume` 実行で処理する。`questions.md` は使用しない。
- `inception_first`: 質問の生成・提示順序は AI-DLC に従い `meta → audience → intent → requirements → views → flows → data → tech` を厳守する。Inception 未完了の状態で Construction 質問を先頭に積んではならない。
- `core_schema_compliant`: Writes must preserve `meta`, `entities`, `flows`, and `views` in `spec.json`, and `pending`, `answered` in `questions.json`. Optional sections `meta.audience`, `meta.intent`, `requirements` も保持する。
- `preserve_human_decision`: If a branch requires user judgment, use AskUserQuestion when available. If unavailable, write to `questions.md` and stop.
- `language_consistent`: Localize explanations and questions using `meta.lang`; keep file paths, JSON keys, status markers, and command names literal.

### Output Contract

Every run ends with exactly one of these outcomes:

- `files_written`: files changed, summary reported, pending count reported.
- `questions_batch`: up to 4 questions presented via AskUserQuestion.
- `blocked`: no unsafe write performed, reason reported, next action provided.
- `complete`: no mutation needed, current state and next gate reported.

### Quality Gate

Before responding, verify:

- Any written spec has `meta.name`, `meta.version`, `entities`, `flows`, and `views`.
- Any written field type is one of `string`, `number`, `date`, `enum`, `text`, `boolean`.
- Any written enum has at least one string option.
- Any written question entry has `id`, `phase`, `question`, `type`, and `resolves`.
- `phase` is one of `meta`, `audience`, `intent`, `requirements`, `tech`, `data`, `views`, `flows`, or `update`.
- `pending` does not contain duplicate unresolved questions for the same normalized `resolves` set.
- The response includes lifecycle stage, changed artifacts, pending count, and the next gate.

## Core Data Contracts

このスキルが読み取るファイルのデータ構造を以下に定義する。

### `.reforge/specs/<name>/spec.json`

```json
{
  "meta": {
    "name": "プロジェクト名",
    "version": "0.1.0",
    "lang": "ja",
    "approved": false,
    "audience": ["個人ユーザー"],
    "intent": "ユーザーの課題説明"
  },
  "requirements": [
    { "id": "req_1", "as": "個人ユーザー", "want": "日報を記録できる", "so_that": "週次で振り返れる" }
  ],
  "tech": { "frontend": "...", "backend": "...", "database": "..." },
  "entities": { "EntityName": { "fields": [] } },
  "views": {},
  "flows": {}
}
```

- `meta.approved`: `true` の場合のみ `/reforge-plan` が実行可能
- `meta`, `tech`, `entities`, `views`, `flows` がすべて存在することがスキーマ合格の最低条件
- `meta.audience`, `meta.intent`, `requirements` は AI-DLC Inception 段階の必須化が望ましいが、スキーマ的には optional（後方互換）

### `.reforge/specs/<name>/questions.json`

```json
{
  "pending": [
    {
      "id": "一意のスネークケース識別子",
      "phase": "meta | audience | intent | requirements | tech | data | views | flows | update",
      "question": "ユーザー向けの質問文",
      "type": "text | single_choice | multi_choice | multi_input | confirm",
      "resolves": ["spec.json 上の反映先 JSON パス"]
    }
  ],
  "answered": []
}
```

- `pending` 配列に1件以上ある場合、バリデーション・approved 確認より優先して質問を処理する

### `.reforge/specs/<name>/tasks.json`

```json
[
  {
    "id": "EntityName",
    "entity": "EntityName",
    "status": "pending | in_progress | done",
    "subtasks": ["db", "api", "ui", "test"],
    "verify_done": false
  }
]
```

- `status` が `"pending"` または `"in_progress"` のタスクが存在する場合、実装が未完了
- 全タスクが `"done"` かつ `verify_done: true`（または `verify_at` タイムスタンプが存在）の場合にのみ verify 完了と判定する
- `verify_done` フィールドが存在しない場合、verify 未完了として扱う

## Command Flow（ナビゲーター判定ロジック）

最初に一致した条件で停止する（stop at the first matching condition）。以下の8ステップを **必ずこの順序で** 評価し、最初に一致した条件で処理を終了する。順序の変更は禁止されている。

### ステップ 0: Spec Resolution（要件 2.0）

Spec Resolution ロジックを実行して `<name>` と各パスを確定する。

- **spec が解決できない場合**（spec が 0 件）:
  - ライフサイクルステージ `blocked` を報告する。
  - 「`/reforge-init "<プロダクトの説明>"` を実行してください。」と案内して終了する。

- **複数 specs が存在し引数がない場合**:
  - 一覧表示して AskUserQuestion で選択を求める。

spec が確定したらステップ 1 へ進む。

### ステップ 1: spec.json 存在チェック（`SPEC_PATH` missing）（要件 2.1）

解決された `SPEC_PATH` を読み取る。

- **ファイルが存在しない場合**:
  - ライフサイクルステージ `blocked` を報告する。
  - 「`SPEC_PATH` が見つかりません。`/reforge-init "<プロダクトの説明>"` を実行してください。」と案内して終了する。

ファイルが存在する場合はステップ 2 へ進む。

### ステップ 2: questions.json の pending チェック（`QUESTIONS_PATH` pending）（要件 2.2）

`QUESTIONS_PATH`（`.reforge/specs/<name>/questions.json`）を読み取る。
`QUESTIONS_MD_PATH` が存在する場合は先に Answer 行を解析して反映を試みる（後述「質問機能プロトコル Step 5 / 6」参照）。

- **`pending` 配列に1件以上ある場合**:
  - AI-DLC phase 優先度（`meta → audience → intent → requirements → data → flows → views → tech → update`）で pending を並べる。
  - 「質問機能プロトコル」Step 2 の提示モード判定に従う:
    - 件数に関係なく `AskUserQuestion` を **1 回だけ** 呼び出して先頭 4 問のバッチを提示する（5件以上の場合は残りを次回に持ち越す）。
  - ユーザーから回答を受け取ったら「質問機能プロトコル」Step 5 / 6 / 7 に従い `SPEC_PATH` と `QUESTIONS_PATH` を一括更新する。
  - ライフサイクルステージは `questions_batch` として報告し、終了する。

`pending` が空の場合はステップ 3 へ進む。

### ステップ 3: reforge-validate チェック（reforge-validate fails）（要件 2.3）

`SPEC_PATH` の内容に対してインラインでスキーマ検証を実施する。以下の条件をすべて確認する:

1. `meta` セクションが存在し、`meta.name`・`meta.version` が空でないこと
2. `tech` セクションが存在すること
3. `entities` セクションが存在すること
4. `views` セクションが存在すること
5. `flows` セクションが存在すること

加えて AI-DLC Inception の完了度を info として確認する（エラーには昇格しない）:

- `meta.audience` が空配列または未定義
- `meta.intent` が空文字または未定義
- `requirements` が空配列または未定義

これらは合否に影響しないが、Inception フェーズの完了度を Completion Report に併記する。

- **1件以上の検証エラーがある場合**:
  - バリデーションエラーの一覧を表示する（エラーごとに該当フィールドと修正方法を明記する）。
  - 「`.reforge/specs/<name>/spec.json` のエラーを修正してから再実行してください。」と案内して終了する。

すべての検証に合格した場合はステップ 4 へ進む。

### ステップ 4: meta.approved チェック（`meta.approved` is `false`）（要件 2.4）

`spec.meta.approved` の値を確認する。

- **`meta.approved` が `false` の場合**:
  - ライフサイクルステージ `blocked` を報告する。
  - 「仕様がまだ承認されていません。`/reforge-render` を実行して UI プロトタイプを確認し、承認してください。」と案内して終了する。

`meta.approved` が `true` の場合はステップ 5 へ進む。

### ステップ 5: tasks.json 存在チェック（`TASKS_PATH` missing）（要件 2.5）

`TASKS_PATH`（`.reforge/specs/<name>/tasks.json`）を読み取る。

- **ファイルが存在しない場合**:
  - ライフサイクルステージ `blocked` を報告する。
  - 「タスクキューが存在しません。`/reforge-plan` を実行してタスクキューを生成してください。」と案内して終了する。

ファイルが存在する場合はステップ 6 へ進む。

### ステップ 6: pending / in_progress タスク存在チェック（`pending` or `in_progress` task exists）（要件 2.6）

`tasks.json` を解析し、`status` が `"pending"` または `"in_progress"` のタスクを検索する。

- **該当タスクが1件以上ある場合**:
  - 最初に見つかった `"in_progress"` タスク（存在しない場合は最初の `"pending"` タスク）を次タスクとして選択する。
  - 選択したタスクの `entity` 値を取得する。
  - ライフサイクルステージ `blocked` を報告する。
  - 「実装中のタスクがあります。`/reforge-impl [entity]`（`[entity]` を `<entity値>` に置き換え）を実行してください。」と案内して終了する。

すべてのタスクが `"done"` の場合はステップ 7 へ進む。

### ステップ 7: verify 完了チェック（verification is not complete）（要件 2.7）

全タスクが `"done"` であることを前提に、verify 完了状態を確認する。

verify 完了の判定条件（いずれかを満たすこと）:
- すべてのタスクエントリに `verify_done: true` が設定されている
- すべてのタスクエントリに `verify_at` タイムスタンプが存在する

- **verify が完了していない場合（上記条件を満たさない場合）**:
  - ライフサイクルステージ `blocked` を報告する。
  - 「全タスクの実装が完了しました。`/reforge-verify` を実行して動作検証を行ってください。」と案内して終了する。

verify が完了している場合はステップ 8 へ進む。

### ステップ 8: 全完了報告（project complete）（要件 2.8）

すべての条件を通過した場合、プロジェクトが完了している。

- ライフサイクルステージ `complete` を報告する。
- 「プロジェクトの全フェーズが完了しました。spec.json の承認・全タスクの実装・検証がすべて完了しています。」と報告して終了する。

## 質問機能プロトコル

このスキルは以下のバッチ運用プロトコルに従って質問を処理します。全 reforge-engine コマンドで同一プロトコルを使用します。

### Step 1: 取得（pending の取得・新規生成）

`.reforge/specs/<name>/questions.json` の `pending` 配列を読み込み、AI-DLC phase 優先度（`meta → audience → intent → requirements → views → flows → data → tech → update`）に従って並べます。新規質問を生成する場合は以下の形式でエントリを追加します。

```json
{
  "id": "一意のスネークケース識別子",
  "phase": "meta | audience | intent | requirements | tech | data | views | flows | update のいずれか",
  "question": "ユーザー向けの質問文（meta.lang に従ってローカライズ）",
  "type": "text | single_choice | multi_choice | multi_input | confirm のいずれか",
  "resolves": ["spec.json 上の反映先 JSON パス（例: meta.audience, requirements, tech.frontend）"]
}
```

> **制約**: `id` は既存の `pending` および `answered` と重複してはならない。
> **制約**: `phase` は `meta`・`audience`・`intent`・`requirements`・`tech`・`data`・`views`・`flows`・`update` の 9 値のみ有効。

### Step 2: 提示モード判定

`pending` の件数に応じて以下を選択する:

| `pending` 件数 | 提示モード |
|---|---|
| 0 件 | 提示しない（`complete` を報告して終了） |
| 1〜4 件 | バッチ提示モード（`AskUserQuestion` で一括提示） |
| 5 件以上 | バッチ提示モード（先頭 4 件のみ `AskUserQuestion` で提示し、残りは次の `/reforge-resume` 実行で処理） |

### Step 3: 提示（バッチ・最大 4 問）

`AskUserQuestion` を **1 回だけ** 呼び出し、`questions` 配列に pending 先頭から最大 4 件を入れて一括提示する。pending が 5 件以上の場合も先頭 4 件のみを提示する。

選択型 (`single_choice` / `multi_choice` / `confirm`) は AskUserQuestion の選択肢として渡す。自由記述型 (`text` / `multi_input`) は AskUserQuestion の Other 経由で受け取る。

### Step 5: 反映（バッチ一括）

ユーザー回答（AskUserQuestion 結果）を解析し、各質問の `resolves` に列挙された JSON パスへ一括で反映する。

> **制約**: `resolves` に記載のないパスは変更しない（最小差分の原則）。
> **制約**: 推測による補完は禁止。回答が不十分な質問は反映をスキップし、その質問のみ pending に残す。

### Step 6: 移動（バッチ一括）

反映に成功した質問について、`questions.json` を以下のように更新する。

1. `pending` 配列から該当質問エントリを削除する。
2. `answered` 配列の末尾に同エントリを追加し `answer` フィールドを付与する（`answeredAt` は任意）。
3. すべての書き込みを 1 回のクオリティゲート実行のもとで一括実施する。

```json
// answered に移動後のエントリ例
{
  "id": "define_audience",
  "phase": "audience",
  "question": "このプロダクトの主なターゲットユーザーは誰ですか？（複数選択可）",
  "type": "multi_choice",
  "resolves": ["meta.audience"],
  "answer": "個人ユーザー, 開発者"
}
```

### Step 7: 整合性チェック（Consistency Check）

回答反映（Step 5/6）後、最新の spec.json を検査し、現フェーズで必要な派生質問を `pending` に追加する。

**対象パターン（AI-DLC ordering に従い自動検出）:**

1. `requirements` が確定し `views` が空 → `define_views_list` 質問を生成（未生成の場合のみ）
2. `views` にキーが追加されたが各画面の詳細が文字列だけ（`type` / `description` / `actions` 未定義）→ 各画面の `view_detail_{view_id}` 質問を生成
3. `views` が確定し `flows` が空 → `define_flows_list` 質問を生成（未生成の場合のみ）
4. `flows` にキーが追加されたが各フローの詳細が文字列だけ（`trigger` / `steps` 未定義）→ 各フローの `flow_detail_{flow_id}` 質問を生成
5. `views` と `flows` が確定し `entities` が空 → `define_data_entities` 質問を生成（未生成の場合のみ）

**制約:** 同一実行内での `AskUserQuestion` の2回呼び出しは禁止。整合性チェックで生成した質問は `pending` に追加するだけで、提示は次の `/reforge-resume` 実行に委ねる。

### 追加制約

- **AskUserQuestion 1 呼び出しの原則**: 1 スキル実行内で `AskUserQuestion` を呼ぶのは 1 回のみ（Step 3）。複数呼び出しは禁止。
- **共有ストレージ**: `.reforge/specs/<name>/questions.json` は全 reforge-engine コマンドの共有ストレージ。読み書きの前に必ず最新を読み込む。
- **推測での補完禁止**: 不明な spec フィールドは推測で埋めず、必ず質問を生成して `AskUserQuestion` を通じて確認する。

## Answer Application

If this resume run includes user answers to previously presented questions (either via AskUserQuestion batch or via `questions.md` edits):

1. Identify the pending questions being answered.
2. Apply each answer only to paths listed in its `resolves`.
3. If an answer is insufficient for every `resolves` path, do not mutate those paths in `SPEC_PATH`; leave that question in `pending` and skip just it.
4. For each fully resolved question:
   - Update only the resolved spec paths.
   - Remove the question from `pending`.
   - Append it to `answered`.
   - Keep required fields `id`, `phase`, `question`, `type`, and `resolves`.
   - Optionally add `answer` and `answeredAt`.
5. Run the Quality Gate before writing.

## Core Compliance Rules

- Never create a field with an unknown type.
- Never create `enum` without one or more explicit options.
- Never remove unrelated spec paths while applying an answer.
- Never infer additional fields from examples unless the user explicitly confirms them.

## Completion Report

毎回必ず以下の3要素を **この順番で** 簡潔に出力する。冗長な説明は付けない。

### 1. 進行マップ（必須・1行）

8 ライフサイクルフェーズを横一列で表示する。記号の意味:

- `[✓]` 通過済み（ステップが pass した）
- `[▶]` 現在地（ステップが match して停止した）
- `[ ]` 未着手

固定フォーマット:

```
進行: [?]Init → [?]Questions → [?]Validate → [?]Approve → [?]Plan → [?]Impl → [?]Verify → [?]Done  (現在番号/8)
```

ステップと記号の対応:

| match したステップ | 現在地 | 完了済み |
|---|---|---|
| ステップ 0 / 1 | Init | （なし） |
| ステップ 2 | Questions | Init |
| ステップ 3 | Validate | Init, Questions |
| ステップ 4 | Approve | Init, Questions, Validate |
| ステップ 5 | Plan | Init, Questions, Validate, Approve |
| ステップ 6 | Impl | Init, Questions, Validate, Approve, Plan |
| ステップ 7 | Verify | Init, Questions, Validate, Approve, Plan, Impl |
| ステップ 8 | Done | すべて完了（`[✓]` のみ、`[▶]` なし） |

### 2. 現在フェーズの状況（1行）

`現在: <フェーズ名> — <短い状況>` 形式。例:

- `現在: Questions フェーズ — 未解決質問 3 件 (バッチ提示・今回 3 問)`
- `現在: Questions フェーズ — 未解決質問 7 件 (バッチ提示・今回 4 問、残り 3 問は次回)`
- `現在: Approve フェーズ — meta.approved=false`
- `現在: Impl フェーズ — pending/in_progress タスク 4 件 (次: User)`

### 3. NextAction（1行）

`NextAction: <ユーザーの次の動作> → <実行コマンド>` 形式。ステップ別:

- ステップ 0 一致: `NextAction: プロダクト概要を渡して spec を作成 → /reforge-init "<説明>"`
- ステップ 1 一致: `NextAction: spec.json が無いため初期化 → /reforge-init "<説明>"`
- ステップ 2 一致: `NextAction: 提示したバッチ質問に回答 → /reforge-resume を再実行`
- ステップ 3 一致: `NextAction: spec.json のエラーを修正 → /reforge-resume を再実行`
- ステップ 4 一致: `NextAction: UI プロトタイプを確認して承認 → /reforge-render`
- ステップ 5 一致: `NextAction: タスクキューを生成 → /reforge-plan`
- ステップ 6 一致: `NextAction: 次タスクを実装 → /reforge-impl <entity>`
- ステップ 7 一致: `NextAction: 動作検証を実行 → /reforge-verify`
- ステップ 8 一致: `NextAction: なし（全フェーズ完了）`

### 4. 補助情報（必要時のみ）

以下は **状態変化があった場合のみ** 1行追加する。常時表示しない。

- `Lifecycle: <files_written | questions_batch | answered | blocked | complete>`
- `Changed: SPEC_PATH` / `QUESTIONS_PATH`（書き込みがあった場合のみ）
- `Inception: audience=<count> intent=<set|unset> requirements=<count>`（Inception 段階の進捗が分かる場合）

### 出力例（バッチモード）

```
進行: [✓]Init → [▶]Questions → [ ]Validate → [ ]Approve → [ ]Plan → [ ]Impl → [ ]Verify → [ ]Done  (2/8)
現在: Questions フェーズ — 未解決質問 3 件 (バッチ提示モード)
NextAction: 提示したバッチ質問に回答 → /reforge-resume を再実行
```

### 出力例（5件以上のバッチ）

```
進行: [✓]Init → [▶]Questions → [ ]Validate → [ ]Approve → [ ]Plan → [ ]Impl → [ ]Verify → [ ]Done  (2/8)
現在: Questions フェーズ — 未解決質問 8 件 (バッチ提示・今回 4 問、残り 4 問は次回)
NextAction: 提示したバッチ質問に回答 → /reforge-resume を再実行
```
