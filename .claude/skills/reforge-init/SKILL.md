---
name: reforge-init
description: Initialize a Reforge workspace from a product description, producing .reforge/spec.json and .reforge/questions.json.
allowed-tools: Read, Write, Edit, Glob, AskUserQuestion
argument-hint: "\"<product description>\""
---

# reforge-init

## Core Rule

- Think in English, respond to the user in the language specified by `meta.lang`.
- Treat `.reforge/spec.json` as the single source of truth for the product specification.
- Do not invent missing product decisions. Convert unknowns into pending questions.
- Ask at most one user-facing question per run.
- Keep the skill self-contained. Do not require external prompt files.

## Canonical Paths

- `REFORGE_DIR = ".reforge"`
- `SPECS_DIR = ".reforge/specs"`
- `SPEC_PATH = ".reforge/specs/<name>/spec.json"` (resolved after slug derivation)
- `QUESTIONS_PATH = ".reforge/specs/<name>/questions.json"`
- `PREVIOUS_SPEC_PATH = ".reforge/specs/<name>/spec.previous.json"`

## Spec Name Derivation (reforge-init only)

`meta.name` をケバブケースのスラッグに変換してスペック名を導出する:

1. Unicode 正規化後、ASCII 以外の文字を単語境界として扱う（日本語など）。
2. 英数字のみを残し、スペースや記号はハイフンに変換する。
3. 連続するハイフンを1つにまとめ、先頭・末尾のハイフンを除去する。
4. すべて小文字にし、最大 30 文字に切り詰める。
5. 空文字になった場合は `"spec"` をデフォルト名とする。

例:
- `"日報アプリ"` → `"daily-report"` に相当するが、ASCII 変換できない場合は `"spec"` とし meta 質問を生成する。
- `"Photo Albums"` → `"photo-albums"`
- `"My App v2.0"` → `"my-app-v2-0"`

スラッグ導出後、ファイルは `.reforge/specs/<slug>/` 以下に生成する。

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

### 自然言語から生成された初期 spec.json ドラフト

自然言語のプロダクト説明を解析して spec.json の初期ドラフトを生成する。

```json
{
  "meta": { 
    "name": "daily-report", 
    "version": "0.1.0", 
    "lang": "ja", 
    "approved": false,
    "reforgeVersion": "1.0.0"
  },
  "tech": { "frontend": "", "backend": "", "database": "", "orm": "", "styling": "", "testing": "" },
  "entities": {},
  "views": {},
  "flows": {}
}
```

- `meta.approved` の初期値は常に `false`
- `tech` の各フィールドは質問で確定するまで空文字で初期化する

### 初期 questions.json サンプル

```json
{
  "pending": [
    { "id": "define_tech_frontend", "phase": "tech", "question": "フロントエンドフレームワークは何を使いますか？", "type": "text", "resolves": ["tech.frontend"] },
    { "id": "define_tech_backend", "phase": "tech", "question": "バックエンドの言語・フレームワークは何を使いますか？", "type": "text", "resolves": ["tech.backend"] },
    { "id": "define_tech_database", "phase": "tech", "question": "データベースは何を使いますか？", "type": "text", "resolves": ["tech.database"] },
    { "id": "define_tech_orm", "phase": "tech", "question": "ORM またはデータアクセス層は何を使いますか？", "type": "text", "resolves": ["tech.orm"] },
    { "id": "define_tech_styling", "phase": "tech", "question": "スタイリングは何を使いますか？（例: Tailwind CSS, CSS Modules）", "type": "text", "resolves": ["tech.styling"] },
    { "id": "define_tech_testing", "phase": "tech", "question": "テストフレームワークは何を使いますか？（例: Vitest, Jest）", "type": "text", "resolves": ["tech.testing"] }
  ],
  "answered": []
}
```

### Question Entry

- `id`: stable snake_case identifier.
- `phase`: one of `meta`, `tech`, `data`, `views`, `flows`.
- `question`: localized user-facing question.
- `type`: one of `text`, `single_choice`, `multi_choice`, `multi_input`, `confirm`.
- `resolves`: array of spec paths, such as `entities.report.fields`.

Question priority order:

1. `meta`
2. `tech`
3. `data`
4. `views`
5. `flows`

## Command Flow

1. Require a product description argument. If missing, ask for one product description and stop.
2. Start from the minimal spec shape.
3. Set `meta.name` from the most explicit product/app name in the description. If no name is explicit, use a neutral name and create a `meta` question for the final name.
4. Set `meta.version` to `"0.1.0"`.
5. Set `meta.lang` from existing valid spec language when available; otherwise default to `"en"`.
6. Set `meta.approved` to `false`. This field is always `false` on init; it is only set to `true` by an explicit human approval action.
7. Derive the spec slug from `meta.name` using the Spec Name Derivation rules.
8. Set `SPEC_DIR = ".reforge/specs/<slug>/"`, `SPEC_PATH`, `QUESTIONS_PATH`, `PREVIOUS_SPEC_PATH` accordingly.
9. Read existing `SPEC_PATH` and `QUESTIONS_PATH` when present.
10. If `SPEC_PATH` already exists, do not overwrite it silently.
    - Ask one confirm question: overwrite existing spec or cancel.
    - If the user chooses overwrite and an existing spec is valid JSON, save it to `PREVIOUS_SPEC_PATH` before writing the new spec.
11. Extract only explicit entities, fields, views, and flows:
    - If an entity is explicitly named, add it.
    - If a field is explicitly named and its type is clear, add it.
    - If a field exists but type is unclear, create a question instead of guessing.
    - If a view or flow is not explicit, leave it absent and create the next needed question.
12. Generate pending questions for missing decisions needed to complete a useful MVP spec.
13. De-duplicate pending questions by normalized `resolves`.
14. Write `SPEC_PATH` and `QUESTIONS_PATH` only after the Quality Gate passes.
15. Present the highest-priority pending question if one exists; otherwise report that `/reforge-validate` can be run.

## Unknown Handling Rules

Create questions rather than guessing for:

- Primary entity name.
- Entity fields.
- Field types.
- Required vs optional fields.
- Enum options.
- Initial views.
- User flows.
- Any destructive overwrite.

Representative questions:

- English: `What fields should this app track for the main entity?`
- Japanese: `このアプリの主要エンティティでは、どの項目を扱いますか？`

## Tech Field Question Generation

### Step 3: techフィールド質問生成

`spec.json` の `tech` セクションには 6 つの必須サブフィールドがある: `frontend`, `backend`, `database`, `orm`, `styling`, `testing`。

各サブフィールドについて、プロダクト説明から推測不能な場合は `questions.json` の `pending` 配列へ質問エントリを追加する。

#### questions.json の初期化手順

`questions.json` が存在しない場合、またはゼロから生成する場合は、以下の形式で初期化する:

```json
{
  "pending": [],
  "answered": []
}
```

その後、推測不能なフィールドの質問エントリを `pending` 配列に追加する。質問がひとつもない場合でも `pending: []` と `answered: []` の空配列で初期化する。

#### 質問エントリのフォーマット

各 tech フィールドの質問エントリは以下のフォーマットに従う:

- `id`: `"define_tech_{field}"` — 例: `"define_tech_frontend"`
- `phase`: `"tech"` — tech フィールドの質問は常に `"tech"`
- `question`: 日本語の質問文 — 下記の推奨質問文を参照
- `type`: `"single_choice"` または `"text"` — 選択肢が明確な場合は `"single_choice"`、自由記述の場合は `"text"`
- `resolves`: `["tech.{field}"]` — 例: `["tech.frontend"]`

#### 6 サブフィールドと推奨質問文

| フィールド | id | 推奨質問文 |
|---|---|---|
| `frontend` | `define_tech_frontend` | フロントエンドフレームワークは何を使いますか？ |
| `backend` | `define_tech_backend` | バックエンドの言語・フレームワークは何を使いますか？ |
| `database` | `define_tech_database` | データベースは何を使いますか？ |
| `orm` | `define_tech_orm` | ORM またはデータアクセス層は何を使いますか？ |
| `styling` | `define_tech_styling` | スタイリングは何を使いますか？（例: Tailwind CSS, CSS Modules） |
| `testing` | `define_tech_testing` | テストフレームワークは何を使いますか？（例: Vitest, Jest） |

#### 例: フロントエンドが推測不能な場合

```json
{
  "id": "define_tech_frontend",
  "phase": "tech",
  "question": "フロントエンドフレームワークは何を使いますか？",
  "type": "single_choice",
  "resolves": ["tech.frontend"]
}
```

#### 重複排除

`resolves` が同一の質問が `pending` にすでに存在する場合は追加しない（de-duplicate by normalized `resolves`）。

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

If this init run includes an answer to the single question it just presented, or if the runtime resumes the same command with that answer:

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

## Completion Report

Report concisely:

- Lifecycle stage: `initialized`.
- Spec directory: `.reforge/specs/<slug>/`.
- Changed artifacts: `SPEC_PATH`, `QUESTIONS_PATH`, and optionally `PREVIOUS_SPEC_PATH`.
- Pending question count.
- Next gate:
  - If pending count is 0: `/reforge-validate`.
  - If pending count is greater than 0: answer the presented question or run `/reforge-resume`.
