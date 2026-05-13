---
name: reforge-update
description: Apply a natural-language change request to .reforge/specs/<name>/spec.json as a safe diff, preserving unrelated spec paths. Supports new Inception fields (meta.audience / meta.intent / requirements). Ambiguous changes generate pending questions (batch via AskUserQuestion, or questions.md when 5+). Approval changes and entity changes auto-archive tasks.json for re-planning.
allowed-tools: Read, Write, Edit, Glob, AskUserQuestion
argument-hint: "\"<change request>\""
---

# reforge-update

## Core Rule

- Think in English, respond to the user in the language specified by `meta.lang`.
- Treat `.reforge/specs/<name>/spec.json` as the single source of truth for the product specification.
- Do not invent missing product decisions. Convert unknowns into pending questions.
- 1 回のスキル実行で `AskUserQuestion` を呼ぶのは 1 度きり。pending 件数に関係なく常に先頭 4 件までをバッチ提示し、残りは次の実行で処理する（後述「質問機能プロトコル」参照）。
- Keep the skill self-contained. Do not require external prompt files.

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
- `batch_questions`: Present pending questions in batches of up to 4 via `AskUserQuestion`. pending が 5 件以上の場合も先頭 4 件のみを提示し、残りは次の `/reforge-resume` 実行で処理する。`questions.md` は使用しない。
- `inception_first`: 質問の生成・提示順序は AI-DLC に従い `meta → audience → intent → requirements → views → flows → data → tech` を厳守する。
- `core_schema_compliant`: Writes must preserve `meta`, `entities`, `flows`, and `views` in `spec.json`, and `pending`, `answered` in `questions.json`. Optional sections `meta.audience`, `meta.intent`, `requirements` も保持する。
- `preserve_human_decision`: If a branch requires user judgment, use AskUserQuestion when available. If unavailable, ask one concise question in chat and stop.
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

## Command Flow

1. Require a change request argument. If missing, ask for one change request and stop.
2. Read `SPEC_PATH`.
   - If missing, block and report that `/reforge-init "<description>"` is required before update.
   - If invalid JSON, block and report the file that must be fixed.
3. Read `QUESTIONS_PATH` if present; otherwise start from `{ "pending": [], "answered": [] }`.
4. **update スキル固有**: チェンジタイプが `ambiguous` と分類された場合、不明な点を解決する質問エントリを作成して `pending` に追加し、ステップ 2（質問の提示）へ進む。`SPEC_PATH` は変更しない。Classify the change request:
   - `add`: adds a new entity, field, view, flow, requirement, or audience tag.
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
   - Preserve unrelated entities, fields, flows, views, requirements, and context.
6. If the change is conflicting, destructive, or ambiguous:
   - Do not mutate `SPEC_PATH`.
   - Add or present pending questions that resolve the missing decisions. pending 先頭 4 件を AskUserQuestion バッチで提示し、5 件以上の場合は残りを次の実行で処理する。
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
- For a new requirement (`requirements[]`):
  - Each entry must have `id`, `as`, `want`, `so_that` fields.
  - Generate the `id` as snake_case (`req_<N>` or a content-derived slug) and avoid collisions.
  - If any of `as` / `want` / `so_that` is unclear, create a `requirements` phase question instead of writing partial data.
- For audience / intent edits:
  - `meta.audience` is `string[]`; preserve existing tags unless the user explicitly removes them.
  - `meta.intent` is a single string; replacing it should be an explicit user instruction.
- For context edits (`context.*`):
  - Preserve existing context unless the user explicitly changes it.
  - `context.mode` may be `greenfield`, `brownfield`, or `unknown`.
  - Brownfield scope fields (`affectedAreas`, `allowedWriteAreas`, `protectedAreas`, `acceptanceCriteria`, `risks`) are append-only unless the user explicitly removes or replaces entries.
  - If a change request would require editing outside `context.changeScope.allowedWriteAreas`, create a pending question instead of silently widening the scope.
- For removal:
  - Treat broad removal as destructive and ask for confirmation unless the target path is exact.

## Question Rules

- New update questions use `phase: "update"` unless they clearly belong to `audience`, `intent`, `requirements`, `data`, `view`, `flow`, or `tech`.
- Question `resolves` must point to the spec path blocked by the change.
- Present pending questions in batches following the shared protocol (up to 4 via AskUserQuestion; if 5+ pending, present first 4 and defer the rest to the next run).

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

## Step 7: 整合性チェック（Consistency Check）

バッチ回答反映後（Step 5/6 完了後）、以下のパターンを順番にチェックし、派生質問を `pending` に追加する。**追加のみ行い、AskUserQuestion は呼ばない**（次回 `/reforge-resume` または `/reforge-answer` 実行時に提示される）。

| チェックパターン | 条件 | 生成する質問 |
|---|---|---|
| requirements → views | `requirements` に story がある && `views` が空 | `define_views_list`（multi_input） |
| views list → detail | `views` にキーがある && detail が空 (`{}`) のビューがある | `view_detail_{view_id}`（text、対象ビューごとに 1 件） |
| views → flows | `views` に detail がある && `flows` が空 | `define_flows_list`（multi_input） |
| flows list → detail | `flows` にキーがある && detail が空 (`{}`) のフローがある | `flow_detail_{flow_id}`（text、対象フローごとに 1 件） |
| views+flows → data | `views` と `flows` に detail がある && `data.entities` が空 | `define_data_entities`（multi_input） |

既に同一 `id` の質問が `pending` または `answered` に存在する場合は追加しない。

## Completion Report

Report concisely:

- Lifecycle stage: `updated`, `questions_batch`, or `blocked`.
- Changed artifacts: `SPEC_PATH`, `QUESTIONS_PATH`, `PREVIOUS_SPEC_PATH`, `TASKS_PREVIOUS_PATH`, or `none`.
- Changed spec paths when a patch was applied.
- Pending question count if any.
- `meta.approved` の遷移（`true` → `false` に変わった場合は明示する）と `tasks.json` の退避有無。
- Next gate: 常に `/reforge-resume` を案内する。resume が現在地（質問・再承認・再 plan のいずれか）を判定して以降の手順をナビゲートする。`/reforge-validate` は resume が内部で実行するため、ユーザーが手動で叩く必要はない。
