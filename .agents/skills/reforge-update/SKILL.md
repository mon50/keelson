---
name: reforge-update
description: Apply a natural-language change request to .reforge/spec.json as a safe diff, preserving unrelated spec paths.
allowed-tools: Read, Write, Edit, Glob, AskUserQuestion
argument-hint: "\"<change request>\""
---

# reforge-update

## Core Rule

- Think in English, respond to the user in the language specified by `meta.lang`.
- Treat `.reforge/spec.json` as the single source of truth for the product specification.
- Do not invent missing product decisions. Convert unknowns into pending questions.
- Ask at most one user-facing question per run.
- Keep the skill self-contained. Do not require external prompt files.

## Canonical Paths

- `REFORGE_DIR = ".reforge"`
- `SPECS_DIR = ".reforge/specs"`
- `SPEC_PATH = ".reforge/specs/<name>/spec.json"` (resolved by Spec Resolution)
- `QUESTIONS_PATH = ".reforge/specs/<name>/questions.json"`
- `PREVIOUS_SPEC_PATH = ".reforge/specs/<name>/spec.previous.json"`
- `TASKS_PATH = ".reforge/specs/<name>/tasks.json"`
- `TASKS_PREVIOUS_PATH = ".reforge/specs/<name>/tasks.previous.json"`

## Spec Resolution (reforge-update [<spec-name>] "<change request>")

引数の解釈: 最初の引数が既存の `.reforge/specs/` ディレクトリ名と一致する場合は spec 名として扱い、残りを change request とする。一致しない場合は引数全体を change request として扱う。

1. spec 名が特定された場合 → `.reforge/specs/<name>/` が存在すれば使用、なければエラー報告して `blocked`。
2. spec 名なし + `.reforge/specs/` 内の spec が 1 つ → 自動選択して続行。
3. spec 名なし + specs が複数 → 一覧表示して AskUserQuestion で選択を求める。
4. spec 名なし + specs が 0 → `/reforge-init "<説明>"` を案内して `blocked`。

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

## Command Flow

1. Require a change request argument. If missing, ask for one change request and stop.
2. Read `SPEC_PATH`.
   - If missing, block and report that `/reforge-init "<description>"` is required before update.
   - If invalid JSON, block and report the file that must be fixed.
3. Read `QUESTIONS_PATH` if present; otherwise start from `{ "pending": [], "answered": [] }`.
4. **update スキル固有**: チェンジタイプが `ambiguous` と分類された場合、不明な点を解決する質問エントリを作成して `pending` に追加し、ステップ 2（質問の提示）へ進む。`SPEC_PATH` は変更しない。Classify the change request:
   - `add`: adds a new entity, field, view, or flow.
   - `modify`: changes an existing explicit spec path.
   - `remove`: removes an existing explicit spec path.
   - `conflict`: contradicts existing spec.
   - `ambiguous`: lacks required details.
5. If the change can be applied safely:
   - Save the current parsed spec to `spec.previous.json` (`PREVIOUS_SPEC_PATH`) 書き込む前に保存する。
   - **`meta.approved` 確認フロー**: 提案された変更が `meta.approved` を設定・変更・削除する場合:
     - ユーザーに警告する: 「この変更は `meta.approved` を変更します。承認状態がリセットされると `/reforge-plan` や `/reforge-impl` が実行できなくなります。」
     - `AskUserQuestion` を使って続行するか確認を求める。
     - ユーザーが拒否した場合は `meta.approved` の変更を適用しない（他の変更は適用可能）。
   - **tasks.json の退避**: 変更を適用した結果、`meta.approved` が `true` → `false` に遷移する場合（または既存の `entities` セクションが `add`/`modify`/`remove` のいずれかで変更される場合）:
     - `TASKS_PATH` (`.reforge/specs/<name>/tasks.json`) が存在すれば、`TASKS_PREVIOUS_PATH` (`.reforge/specs/<name>/tasks.previous.json`) にリネーム（既存の previous は上書き）して退避する。
     - これにより `reforge-resume` の Step 5（tasks.json 不在チェック）が再 match し、再承認後に `/reforge-plan` が案内される。
     - 退避を行った場合は Completion Report の Changed artifacts に `TASKS_PREVIOUS_PATH` を含める。
   - Apply only the relevant spec paths.
   - Preserve unrelated entities, fields, flows, and views.
6. If the change is conflicting, destructive, or ambiguous:
   - Do not mutate `SPEC_PATH`.
   - Add or present exactly one pending question that resolves the missing decision.
   - Avoid duplicate pending questions for the same `resolves`.
7. Run the Quality Gate before writing any changed file.
8. Report changed paths and pending count.

## Patch Planning Rules

- Express every intended mutation as a spec path before applying it.
- Preserve all unrelated paths by default.
- For a new field:
  - Use a core field type only when explicit.
  - If type is unclear, create a `data` or `update` question.
  - If type is `enum`, require explicit options.
- For a new flow:
  - Ensure referenced entities exist.
  - If an entity reference is unclear, create a question.
- For a new view:
  - Ensure `type` is explicit enough to write as a string.
  - Ensure referenced entity names already exist or are queued as questions.
- For removal:
  - Treat broad removal as destructive and ask for confirmation unless the target path is exact.

## Question Rules

- New update questions use `phase: "update"` unless they clearly belong to `data`, `view`, or `flow`.
- Question `resolves` must point to the spec path blocked by the change.
- Present only the highest-priority new or existing pending question.

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

## Minimal Diff Example

以下は `entities.report.fields.status.options` に `archived` を追加する変更の最小例:

変更前 (`spec.previous.json`):

```json
{
  "meta": { "name": "daily-report", "version": "0.1.0", "lang": "ja", "approved": false },
  "tech": { "frontend": "Next.js", "backend": "Node.js / Express", "database": "PostgreSQL", "orm": "Prisma", "styling": "Tailwind CSS", "testing": "Vitest" },
  "entities": {
    "report": {
      "fields": {
        "title": { "type": "string", "required": true },
        "status": { "type": "enum", "options": ["draft", "submitted"] }
      }
    }
  },
  "views": { "reportList": { "type": "list", "entity": "report" } },
  "flows": {}
}
```

変更後 (`spec.json`):

```json
{
  "meta": { "name": "daily-report", "version": "0.1.0", "lang": "ja", "approved": false },
  "tech": { "frontend": "Next.js", "backend": "Node.js / Express", "database": "PostgreSQL", "orm": "Prisma", "styling": "Tailwind CSS", "testing": "Vitest" },
  "entities": {
    "report": {
      "fields": {
        "title": { "type": "string", "required": true },
        "status": { "type": "enum", "options": ["draft", "submitted", "archived"] }
      }
    }
  },
  "views": { "reportList": { "type": "list", "entity": "report" } },
  "flows": {}
}
```

変更パス: `entities.report.fields.status.options`

## Completion Report

Report concisely:

- Lifecycle stage: `updated`, `question_needed`, or `blocked`.
- Changed artifacts: `SPEC_PATH`, `QUESTIONS_PATH`, `PREVIOUS_SPEC_PATH`, `TASKS_PREVIOUS_PATH`, or `none`.
- Changed spec paths when a patch was applied.
- Pending question count.
- `meta.approved` の遷移（`true` → `false` に変わった場合は明示する）と `tasks.json` の退避有無。
- Next gate: 常に `/reforge-resume` を案内する。resume が現在地（質問・再承認・再 plan のいずれか）を判定して以降の手順をナビゲートする。`/reforge-validate` は resume が内部で実行するため、ユーザーが手動で叩く必要はない。

