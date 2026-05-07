---
name: reforge-resume
description: 全フェーズ状態を判定し、次に実行すべきアクションを案内するナビゲーター。spec.json / questions.json / tasks.json を読み取り、固定順序で状態を判定する。
allowed-tools: Read, Write, Edit, Glob, AskUserQuestion
---

# reforge-resume

## Core Rule

- Think in English, respond to the user in the language specified by `meta.lang`.
- Treat `.reforge/spec.json` as the single source of truth for the product specification.
- Do not invent missing product decisions. Convert unknowns into pending questions.
- Ask at most one user-facing question per run.
- Keep the skill self-contained. Do not require external prompt files.
- 判定ロジックの順序を変更してはならない（不変条件）。

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
- `one_question_only`: Present only the single highest-priority pending question.
- `core_schema_compliant`: Writes must preserve `meta`, `entities`, `flows`, and `views` in `spec.json`, and `pending`, `answered` in `questions.json`.
- `preserve_human_decision`: If a branch requires user judgment, use AskUserQuestion when available. If unavailable, ask one concise question in chat and stop.
- `language_consistent`: Localize explanations and questions using `meta.lang`; keep file paths, JSON keys, status markers, and command names literal.

### Output Contract

Every run ends with exactly one of these outcomes:

- `files_written`: files changed, summary reported, pending count reported.
- `question`: one question presented, partial state saved when safe.
- `blocked`: no unsafe write performed, reason reported, next action provided.
- `complete`: no mutation needed, current state and next gate reported.

### Quality Gate

Before responding, verify:

- Any written spec has `meta.name`, `meta.version`, `entities`, `flows`, and `views`.
- Any written field type is one of `string`, `number`, `date`, `enum`, `text`, `boolean`.
- Any written enum has at least one string option.
- Any written question entry has `id`, `phase`, `question`, `type`, and `resolves`.
- `pending` does not contain duplicate unresolved questions for the same normalized `resolves` set.
- The response includes lifecycle stage, changed artifacts, pending count, and the next gate.

## Core Data Contracts

このスキルが読み取るファイルのデータ構造を以下に定義する。

### `.reforge/spec.json`

```json
{
  "meta": {
    "name": "プロジェクト名",
    "version": "0.1.0",
    "lang": "ja",
    "approved": false
  },
  "tech": { "frontend": "...", "backend": "...", "database": "..." },
  "entities": { "EntityName": { "fields": [] } },
  "views": {},
  "flows": {}
}
```

- `meta.approved`: `true` の場合のみ `/reforge-plan` が実行可能
- `meta`, `tech`, `entities`, `views`, `flows` がすべて存在することがスキーマ合格の最低条件

### `.reforge/questions.json`

```json
{
  "pending": [
    {
      "id": "一意のスネークケース識別子",
      "phase": "meta | tech | data | views | flows",
      "question": "ユーザー向けの質問文",
      "type": "text | single_choice | multi_choice | multi_input | confirm",
      "resolves": ["spec.json 上の反映先 JSON パス"]
    }
  ],
  "answered": []
}
```

- `pending` 配列に1件以上ある場合、バリデーション・approved 確認より優先して質問を処理する

### `.reforge/tasks.json`

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
  - 「`/reforge:init "<プロダクトの説明>"` を実行してください。」と案内して終了する。

- **複数 specs が存在し引数がない場合**:
  - 一覧表示して AskUserQuestion で選択を求める。

spec が確定したらステップ 1 へ進む。

### ステップ 1: spec.json 存在チェック（`SPEC_PATH` missing）（要件 2.1）

解決された `SPEC_PATH` を読み取る。

- **ファイルが存在しない場合**:
  - ライフサイクルステージ `blocked` を報告する。
  - 「`SPEC_PATH` が見つかりません。`/reforge:init "<プロダクトの説明>"` を実行してください。」と案内して終了する。

ファイルが存在する場合はステップ 2 へ進む。

### ステップ 2: questions.json の pending チェック（`QUESTIONS_PATH` pending）（要件 2.2）

`QUESTIONS_PATH`（`.reforge/questions.json`）を読み取る。

- **`pending` 配列に1件以上ある場合**:
  - `pending[0]`（最優先の未解決質問）を取得する。
  - AskUserQuestion を使って、その1問のみをユーザーに提示する。
  - ユーザーから回答を受け取ったら「回答の反映」セクションの手順に従い spec.json と questions.json を更新する。
  - ライフサイクルステージ `question` を報告して終了する。

`pending` が空の場合はステップ 3 へ進む。

### ステップ 3: reforge-validate チェック（reforge-validate fails）（要件 2.3）

`SPEC_PATH` の内容に対してインラインでスキーマ検証を実施する。以下の条件をすべて確認する:

1. `meta` セクションが存在し、`meta.name`・`meta.version` が空でないこと
2. `tech` セクションが存在すること
3. `entities` セクションが存在すること
4. `views` セクションが存在すること
5. `flows` セクションが存在すること

- **1件以上の検証エラーがある場合**:
  - バリデーションエラーの一覧を表示する（エラーごとに該当フィールドと修正方法を明記する）。
  - 「`.reforge/spec.json` のエラーを修正してから再実行してください。」と案内して終了する。

すべての検証に合格した場合はステップ 4 へ進む。

### ステップ 4: meta.approved チェック（`meta.approved` is `false`）（要件 2.4）

`spec.meta.approved` の値を確認する。

- **`meta.approved` が `false` の場合**:
  - ライフサイクルステージ `blocked` を報告する。
  - 「仕様がまだ承認されていません。`/reforge:render` を実行して UI プロトタイプを確認し、承認してください。」と案内して終了する。

`meta.approved` が `true` の場合はステップ 5 へ進む。

### ステップ 5: tasks.json 存在チェック（`TASKS_PATH` missing）（要件 2.5）

`TASKS_PATH`（`.reforge/tasks.json`）を読み取る。

- **ファイルが存在しない場合**:
  - ライフサイクルステージ `blocked` を報告する。
  - 「タスクキューが存在しません。`/reforge:plan` を実行してタスクキューを生成してください。」と案内して終了する。

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

このスキルは以下の4ステップに従って質問を処理します。全 reforge-engine コマンドで同一プロトコルを使用します。

### Step 1: 取得（ステップ 1: 質問の取得）

`.reforge/questions.json` の `pending` 配列を読み込み、最優先の質問（`pending[0]`）を取得します。  
`pending` が空でこのコマンドが新たな質問を生成する場合は、以下の形式でエントリを作成し `pending` に追加します。

```json
{
  "id": "一意のスネークケース識別子",
  "phase": "meta | tech | data | views | flows のいずれか",
  "question": "ユーザー向けの質問文（meta.lang に従ってローカライズ）",
  "type": "text | single_choice | multi_choice | multi_input | confirm のいずれか",
  "resolves": ["spec.json 上の反映先 JSON パス（例: tech.frontend）"]
}
```

> **制約**: `id` は既存の `pending` および `answered` と重複してはならない。  
> **制約**: `phase` は `meta`・`tech`・`data`・`views`・`flows` の5値のみ有効。

### Step 2: 提示（ステップ 2: 質問の提示）

取得した1問を `AskUserQuestion` を使ってユーザーに提示します。  
**1回の実行で提示できる質問は必ず1問のみです。** 複数の質問を同時に提示することは禁止されています。

### Step 3: 反映（ステップ 3: 回答の反映）

ユーザーから回答を受け取ったら、質問の `resolves` フィールドに列挙された全 JSON パスに対して、回答内容を即座に `.reforge/spec.json` へ反映します。

> **制約**: `resolves` に記載のないパスは変更しない（最小差分の原則）。  
> **制約**: 推測による補完は禁止。回答が不十分な場合は spec.json を変更せず、このステップをスキップして質問を `pending` に残します。

### Step 4: 移動（ステップ 4: 質問の移動）

回答の反映が完了したら、`.reforge/questions.json` を以下のように更新します。

1. `pending` 配列から該当の質問エントリを削除する。
2. `answered` 配列の末尾に同エントリを追加し、`answer` フィールドを付与する（`answeredAt` は任意）。
3. ファイルを書き込む前にクオリティゲートを実行する。

```json
// answered に移動後のエントリ例
{
  "id": "tech_frontend",
  "phase": "tech",
  "question": "フロントエンドフレームワークは何を使用しますか？",
  "type": "single_choice",
  "resolves": ["tech.frontend"],
  "answer": "Next.js"
}
```

### 追加制約

- **同一実行内での複数質問禁止**: 追加の質問が必要な場合は、次の実行サイクル（次回コマンド呼び出し）で処理します。同一呼び出し内で `AskUserQuestion` を複数回呼ぶことは禁止されています。
- **共有ストレージ**: `.reforge/questions.json` は全 reforge-engine コマンドの共有ストレージです。読み書きの前に必ず最新のファイル内容を読み込んでください。
- **推測での補完禁止**: 不明な spec フィールドは推測で埋めず、必ず `AskUserQuestion` を通じて確認します（`no_guessing` 制約）。

## Answer Application

If this resume run includes a user answer to a previously presented question:

1. Identify the pending question being answered.
2. Apply the answer only to paths listed in `resolves`.
3. If the answer is insufficient for every `resolves` path, do not mutate `SPEC_PATH`; leave the question in `pending` and ask one clarifying question.
4. If the answer resolves the question:
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

Report concisely:

- Lifecycle stage: `resumed`, `answered`, `question`, `blocked`, or `complete`.
- Changed artifacts: `SPEC_PATH` and/or `QUESTIONS_PATH`, or `none`.
- Pending question count.
- Next gate (based on which step matched):
  - ステップ 0 一致: `/reforge-init "<説明>"` を実行する（0 specs）または spec を選択する（複数 specs）
  - ステップ 1 一致: `/reforge-init "<説明>"` を実行する
  - ステップ 2 一致: 提示した質問に回答し、再度 `/reforge-resume` を実行する
  - ステップ 3 一致: `spec.json` のエラーを修正してから再実行する
  - ステップ 4 一致: `/reforge-render` を実行して承認を得る
  - ステップ 5 一致: `/reforge-plan` を実行してタスクキューを生成する
  - ステップ 6 一致: `/reforge-impl [entity]` を実行して実装を進める
  - ステップ 7 一致: `/reforge-verify` を実行して動作検証を行う
  - ステップ 8 一致: プロジェクト完了（次のアクションなし）
