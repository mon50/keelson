---
name: reforge-plan
description: spec.json の entities からタスクキュー（tasks.json）を生成する。meta.approved=true の場合のみ実行可能。
allowed-tools: Read, Write
---

# reforge-plan

## Core Rule

- Think in English, respond to the user in the language specified by `meta.lang`.
- Treat `.reforge/spec.json` as the single source of truth for the product specification.
- `meta.approved` が `false` の場合、このスキルは一切のファイルを変更してはならない。
- `tasks.json` の上書きには必ず確認を行うこと。
- Keep the skill self-contained. Do not require external prompt files.

## Canonical Paths

- `SPECS_DIR = ".reforge/specs"`
- `SPEC_PATH = ".reforge/specs/<name>/spec.json"` (resolved by Spec Resolution)
- `QUESTIONS_PATH = ".reforge/specs/<name>/questions.json"`
- `TASKS_PATH = ".reforge/specs/<name>/tasks.json"`

## Spec Resolution (reforge-plan [<spec-name>])

1. 引数で spec 名が渡された場合 → `.reforge/specs/<name>/` が存在すれば使用、なければエラー報告して `blocked`。
2. 引数なし + `.reforge/specs/` 内の spec が 1 つ → 自動選択して続行。
3. 引数なし + specs が複数 → 一覧表示して AskUserQuestion で選択を求める。
4. 引数なし + specs が 0 → `/reforge-init "<説明>"` を案内して `blocked`。

選択された spec 名を `<name>` として Canonical Paths を解決する。

## Prompt Kernel

### Intent

- `spec.json` の `entities` キーをイテレーションし、各エンティティに対応する TaskEntry を生成して `tasks.json` に書き込む。
- 人間の承認（`meta.approved`）を必須ゲートとして扱い、承認なしには一切のファイルを変更しない。
- 未解決の質問が残存している場合は警告を表示するが、処理は継続する（ブロックではない）。
- 生成後は生成されたタスクの一覧を表示する。

### Current State

- 実行前に `SPEC_PATH` と `QUESTIONS_PATH` と `TASKS_PATH` の現在の状態を読み取る。
- `spec.meta.approved` が `false` の場合は即座に処理を停止する（ゲートチェック）。
- `TASKS_PATH` が既存の場合、上書き前にユーザー確認を行う。
- Response language is determined from `spec.meta.lang`; if missing or unreadable, use Japanese.

### Constraints

- `approved_gate`: `meta.approved` が `true` でない限り、`TASKS_PATH` への書き込みを禁止する。
- `no_guessing`: entities キーに存在しないエンティティを追加してはならない。
- `fixed_subtasks`: subtasks は常に `["db", "api", "ui", "test"]` の固定値とする。
- `initial_status_pending`: status の初期値は常に `"pending"` とする。
- `language_consistent`: 説明文は `meta.lang` に従ってローカライズする。ファイルパス、JSON キー、コマンド名はリテラルのままとする。

### Output Contract

Every run ends with exactly one of these outcomes:

- `files_written`: `tasks.json` を生成し、生成されたタスク一覧を報告する。
- `blocked`: ファイル変更を行わず、理由と次のアクションを報告する。
- `cancelled`: ユーザーが上書きをキャンセルした場合、変更なしで終了する。

### Quality Gate

書き込み前に以下を確認する:

- `spec.meta.approved` が `true` であること。
- 生成する各 TaskEntry が `id`、`entity`、`status`、`subtasks` フィールドを持つこと。
- `status` が `"pending"` であること。
- `subtasks` が `["db", "api", "ui", "test"]` であること。
- `tasks.json` のルートが `{ "tasks": [...] }` 形式であること。

## Core Data Contracts

### `spec.json` の entities 構造（入力）

```json
{
  "meta": {
    "name": "プロジェクト名",
    "version": "0.1.0",
    "lang": "ja",
    "approved": true
  },
  "entities": {
    "report": {
      "fields": []
    },
    "user": {
      "fields": []
    }
  }
}
```

- `meta.approved` が `true` の場合のみ処理を継続する
- `entities` の各キーが TaskEntry の `id` および `entity` フィールドになる
- `entities` が空オブジェクト（`{}`）の場合は生成不可としてブロックする

### `tasks.json` の出力構造

```json
{
  "tasks": [
    {
      "id": "report",
      "entity": "report",
      "status": "pending",
      "subtasks": ["db", "api", "ui", "test"]
    },
    {
      "id": "user",
      "entity": "user",
      "status": "pending",
      "subtasks": ["db", "api", "ui", "test"]
    }
  ]
}
```

- ルートは `{ "tasks": [...] }` 形式
- 各エントリの `id` と `entity` はエンティティ名と同値
- `status` は常に `"pending"`
- `subtasks` は常に `["db", "api", "ui", "test"]` の固定配列

### `questions.json` の pending 構造（警告確認用）

```json
{
  "pending": [
    {
      "id": "define_tech_frontend",
      "phase": "tech",
      "question": "フロントエンドフレームワークは何を使いますか？",
      "type": "single_choice",
      "resolves": ["tech.frontend"]
    }
  ],
  "answered": []
}
```

- `pending` 配列に1件以上ある場合、警告を表示する（ブロックはしない）

## Command Flow

### ステップ 0: Spec Resolution（要件 6.0）

Spec Resolution ロジックを実行して `<name>` と各パスを確定する。

- **spec が解決できない場合**（spec が 0 件）:
  - ライフサイクルステージ `blocked` を報告して終了する。

spec が確定したらステップ 1 へ進む。

### ステップ 1: meta.approved ゲートチェック（要件 6.1）

`SPEC_PATH` を読み取る。

- **ファイルが存在しない場合**:
  - ライフサイクルステージ `blocked` を報告する。
  - 「`.reforge/spec.json` が見つかりません。`/reforge-init "<プロダクトの説明>"` を実行してください。」と案内して終了する。

- **`meta.approved` が `false`（または存在しない）場合**:
  - ライフサイクルステージ `blocked` を報告する。
  - 「仕様がまだ承認されていません。`/reforge-render` を実行して UI プロトタイプを確認し、承認を得てから再実行してください。」と案内して終了する。
  - **このステップで終了した場合、以降のステップは一切実行しない。**

`meta.approved` が `true` の場合はステップ 2 へ進む。

### ステップ 2: entities 読み取りと事前警告（要件 6.2, 6.5, 6.6）

**2a: questions.json の pending チェック（要件 6.5）**

`QUESTIONS_PATH`（`.reforge/questions.json`）を読み取る。

- **`pending` 配列に1件以上ある場合**:
  - 警告を表示する: 「未解決の質問が N 件残っています。`/reforge-resume` で質問を解決してから計画を立てることを推奨しますが、このまま続行することもできます。」
  - 処理を停止せず、ステップ 2b へ進む（警告のみ）。

**2b: entities の空チェック（要件 6.6 例外）**

`spec.json` の `entities` フィールドを確認する。

- **`entities` が存在しないまたは空オブジェクト（`{}`）の場合**:
  - ライフサイクルステージ `blocked` を報告する。
  - 「`entities` が定義されていないため `tasks.json` を生成できません。`/reforge-update` または `/reforge-resume` でエンティティを定義してください。」と案内して終了する。

`entities` にキーが存在する場合はステップ 3 へ進む。

### ステップ 3: tasks.json 生成（要件 6.2, 6.3, 6.4）

**3a: 既存 tasks.json の上書き確認（要件 6.4）**

`TASKS_PATH`（`.reforge/tasks.json`）を読み取る。

- **ファイルが既存の場合**:
  - 警告を表示する: 「`.reforge/tasks.json` が既に存在します。上書きすると既存のタスク進捗が失われます。上書きしますか？（yes/no）」
  - ユーザーが `no` または確認しない場合:
    - ライフサイクルステージ `cancelled` を報告する。
    - 「上書きをキャンセルしました。既存の `tasks.json` は変更されていません。」と報告して終了する。
  - ユーザーが `yes` と確認した場合: ステップ 3b へ進む。

- **ファイルが存在しない場合**: ステップ 3b へ進む。

**3b: TaskEntry の生成（要件 6.2, 6.3）**

`spec.json` の `entities` キーをイテレーションし、各エンティティ名に対して以下の形式の TaskEntry を生成する:

```json
{
  "id": "<エンティティ名>",
  "entity": "<エンティティ名>",
  "status": "pending",
  "subtasks": ["db", "api", "ui", "test"]
}
```

すべての TaskEntry を `tasks` 配列に格納し、以下の形式で `TASKS_PATH` に書き込む:

```json
{
  "tasks": [
    {
      "id": "<エンティティ名1>",
      "entity": "<エンティティ名1>",
      "status": "pending",
      "subtasks": ["db", "api", "ui", "test"]
    }
  ]
}
```

- **書き込み前に Quality Gate を実行すること。**
- Quality Gate に合格した場合のみ `TASKS_PATH` へ書き込む。

ステップ 4 へ進む。

### ステップ 4: 結果表示（要件 6.6）

生成結果をユーザーに表示する。以下の情報を含める:

- ライフサイクルステージ `files_written` を報告する。
- 生成されたタスク数（エンティティ数）。
- 各エンティティ名と subtask 一覧を表形式またはリスト形式で表示する。

**表示例:**

```
tasks.json を生成しました（3 タスク）。

| エンティティ | サブタスク                |
|-------------|--------------------------|
| report      | db, api, ui, test        |
| user        | db, api, ui, test        |
| invoice     | db, api, ui, test        |

次のステップ: `/reforge-impl <エンティティ名>` で実装を開始してください。
```

## Error Handling

| 状態 | 動作 |
|------|------|
| `spec.json` が存在しない | `blocked`: `/reforge-init` を案内して終了 |
| `meta.approved` が `false` | `blocked`: `/reforge-render` を案内して終了 |
| `entities` が空または未定義 | `blocked`: エンティティ定義を促して終了 |
| `questions.json` に pending あり | 警告表示（ブロックしない）、処理継続 |
| `tasks.json` が既存 | 上書き確認（yes/no）、no なら `cancelled` |
| Quality Gate 不合格 | `blocked`: 不合格の理由を報告、ファイル書き込みを中止 |

## Completion Report

Report concisely（`meta.lang` に従って応答すること）:

- ライフサイクルステージ: `files_written`、`blocked`、または `cancelled`。
- 変更されたアーティファクト: `TASKS_PATH`、または `none`。
- 生成されたタスク数（`files_written` の場合のみ）。
- 次のゲート:
  - `files_written`: `/reforge-impl <エンティティ名>` を実行する
  - `blocked`（approved 未承認）: `/reforge-render` を実行して承認を得る
  - `blocked`（entities 未定義）: `/reforge-update` または `/reforge-resume` でエンティティを定義する
  - `cancelled`: 既存の `tasks.json` が保持されている（変更なし）
