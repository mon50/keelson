---
name: reforge-init
description: Initialize a Reforge workspace from a product description. Creates `.reforge/specs/<slug>/` containing spec.json (with AI-DLC Inception fields audience/intent/requirements), questions.json, and optionally questions.md (when 5+ pending). Inception questions are queued first; tech questions are deferred until requirements are non-empty. Non-engineer friendly.
allowed-tools: Read, Write, Edit, Glob, AskUserQuestion
argument-hint: "\"<product description>\""
---

# reforge-init

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
- `batch_questions`: Present pending questions in batches of up to 4 via `AskUserQuestion`. pending が 5 件以上の場合も先頭 4 件のみを提示し、残りは次の `/reforge-resume` 実行で処理する。`questions.md` は使用しない。
- `inception_first`: 質問生成順序は AI-DLC に従い `meta → audience → intent → requirements → views → flows → data(entities) → tech` の順を厳守する。Inception 完了前に Construction の質問を pending 先頭に積んではならない。
- `core_schema_compliant`: Writes must preserve `meta`, `entities`, `flows`, and `views` in `spec.json`, and `pending`, `answered` in `questions.json`. Optional sections `meta.audience`, `meta.intent`, `requirements` も保持する。
- `preserve_human_decision`: If a branch requires user judgment, use AskUserQuestion when available. If unavailable, ask via `questions.md` and stop.
- `language_consistent`: Localize explanations and questions using `meta.lang`; keep file paths, JSON keys, status markers, and command names literal.

### Output Contract

Every run ends with exactly one of these outcomes:

- `files_written`: files changed, summary reported, pending count reported.
- `questions_batch`: up to 4 questions presented via AskUserQuestion, partial state saved when safe.
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

### 自然言語から生成された初期 spec.json ドラフト

自然言語のプロダクト説明を解析して spec.json の初期ドラフトを生成する。**AI-DLC Inception 層**（`meta.audience` / `meta.intent` / `requirements`）と **Construction 層**（`tech` / `entities` / `views` / `flows`）を併せ持つ。

```json
{
  "meta": { "name": "daily-report", "version": "0.1.0", "lang": "ja", "approved": false, "audience": [], "intent": "" },
  "requirements": [],
  "context": { "mode": "greenfield" },
  "tech": { "frontend": "", "backend": "", "database": "", "orm": "", "styling": "", "testing": "" },
  "entities": {},
  "views": {},
  "flows": {}
}
```

- `meta.approved` の初期値は常に `false`
- `meta.audience` / `meta.intent` / `requirements` / `tech` の各フィールドは質問で確定するまで空（空配列または空文字）で初期化する
- `context` は任意の導入文脈。新規MVPなら `mode: "greenfield"`、既存リポジトリへの新機能なら `mode: "brownfield"` を使う。判断不能なら `mode: "unknown"` とし、質問で確定する。
- `tech` のサブフィールドは AI-DLC Construction 段階の質問で確定する。**初期化時に tech 質問を即 pending 化することは禁止**。要件（`requirements`）が空でない状態になってから tech 質問を生成する。

### Brownfield Context（既存リポジトリへの新機能）

プロダクト説明が既存リポジトリへの機能追加を示す場合（例: "existing repo", "既存", "このSaaSに招待機能を追加"）、`context.mode` を `"brownfield"` として扱う。

- 軽量なリポジトリ観察のみ行う: `package.json`、framework config、ORM/schema/migration、route/component/test ディレクトリなど、技術スタックと責務境界を示すファイルを `Glob` / `Read` で確認する。
- 既存アプリ全体を完全に reverse engineer したと表現してはならない。Reforge が扱う単位は「新機能・イニシアティブの spec」であり、既存コードは制約と文脈として読む。
- 明確な証拠がある場合のみ `context.repository.detectedStack`、`context.repository.conventions`、`context.changeScope.affectedAreas`、`context.changeScope.allowedWriteAreas`、`context.changeScope.protectedAreas`、`context.acceptanceCriteria`、`context.risks` に記録する。
- 変更範囲、触ってはいけない領域、受け入れ条件、既存権限/監査/通知などが不明なら、`requirements` または `data` / `flows` / `views` phase の pending question として残す。
- Brownfield では `tech.*` をファイルから確実に読める場合だけ埋める。推測で Next.js / Prisma / Vitest などを選ばない。

最小例:

```json
{
  "context": {
    "mode": "brownfield",
    "repository": {
      "existing": true,
      "detectedStack": ["Next.js", "Prisma"],
      "conventions": ["API routes live under src/app/api", "UI components live under src/components"]
    },
    "changeScope": {
      "feature": "team invitations",
      "affectedAreas": ["auth", "teams", "email"],
      "allowedWriteAreas": ["src/app/api/teams", "src/components/teams", "prisma/migrations"],
      "protectedAreas": ["billing", "legacy imports"]
    },
    "acceptanceCriteria": ["Admins can invite a teammate by email", "Existing RBAC rules still gate team settings"],
    "risks": ["Email delivery provider is not identified yet"]
  }
}
```

### 初期 questions.json サンプル

初期化時の pending は **Inception 質問**（audience / intent / requirements）から始める。tech 質問は requirements 確定後の後続実行で生成される。

```json
{
  "pending": [
    { "id": "define_audience", "phase": "audience", "question": "このプロダクトの主なターゲットユーザーは誰ですか？", "type": "multi_choice", "resolves": ["meta.audience"] },
    { "id": "define_intent", "phase": "intent", "question": "このプロダクトはユーザーのどんな課題を解決しますか？（1〜2文）", "type": "text", "resolves": ["meta.intent"] },
    { "id": "define_requirements", "phase": "requirements", "question": "MVP で満たすべきユーザーストーリーを 3〜5 件挙げてください（『〜として、〜したい、なぜなら〜』形式）。", "type": "multi_input", "resolves": ["requirements"] }
  ],
  "answered": []
}
```

### Question Entry

- `id`: stable snake_case identifier.
- `phase`: one of `meta`, `audience`, `intent`, `requirements`, `tech`, `data`, `views`, `flows`, `update`.
- `question`: localized user-facing question.
- `type`: one of `text`, `single_choice`, `multi_choice`, `multi_input`, `confirm`.
- `resolves`: array of spec paths, such as `entities.report.fields`.

Question priority order (AI-DLC Inception → Construction):

1. `meta`
2. `audience`
3. `intent`
4. `requirements`
5. `views` (UI設計を先に確定し、データ構造を後から導出する)
6. `flows`
7. `data` (= entities、views/flows から導出)
8. `tech`
9. `update` (生成されるのは reforge-update の文脈のみ)

## Command Flow

1. Require a product description argument. If missing, ask for one product description and stop.
2. Start from the minimal spec shape including empty `meta.audience`, `meta.intent`, and `requirements`.
3. Set `meta.name` from the most explicit product/app name in the description. If no name is explicit, use a neutral name and create a `meta` question for the final name.
4. Set `meta.version` to `"0.1.0"`.
5. Set `meta.lang` from existing valid spec language when available; otherwise default to `"en"`.
6. Set `meta.approved` to `false`. This field is always `false` on init; it is only set to `true` by an explicit human approval action.
7. Derive the spec slug from `meta.name` using the Spec Name Derivation rules.
8. Set `SPEC_DIR = ".reforge/specs/<slug>/"`, `SPEC_PATH`, `QUESTIONS_PATH`, `QUESTIONS_MD_PATH`, `PREVIOUS_SPEC_PATH` accordingly.
9. Determine `context.mode` from the description and repository signals:
   - `greenfield`: new app / MVP / prototype with no explicit existing repository constraints.
   - `brownfield`: feature work inside an existing application or repository.
   - `unknown`: mode is unclear; create one pending question rather than assuming.
10. In brownfield mode, inspect only lightweight repository signals and record explicit constraints in optional `context` fields. Do not claim complete repository understanding.
11. Read existing `SPEC_PATH` and `QUESTIONS_PATH` when present.
12. If `SPEC_PATH` already exists, do not overwrite it silently.
    - **上書き確認 confirm 質問を、その後の Inception 質問群と同じ AskUserQuestion バッチに統合する**（システムからは 1 回の質問呼び出しだが、ユーザーから見ると「上書き確認 → Inception 質問」の 2 段階を一緒に提示する形）。Q1 を `confirm_overwrite`（type: `confirm` = はい・いいえ確認、選択肢: 「上書き」「キャンセル」）として先頭に置き、Q2 以降に Inception 質問（`define_audience` / `define_intent` / `define_requirements`）を続ける。これで 1 回の AskUserQuestion で confirm + Inception の最大 4 問を一括提示できる。
    - `confirm_overwrite` は `resolves: []`（spec の特定フィールドに紐づかない確認質問）。回答後は `questions.json` の `answered` に `phase: "meta"` で記録する（`pending` には積まない）。
    - **キャンセル時挙動**: ユーザーが Q1 で「キャンセル」を選んだ場合、Q2〜Q4 の回答内容は **無視し `SPEC_PATH` には書き込まない**。`questions.json` の `answered` には `confirm_overwrite` のみを `answer: "キャンセル"` で記録し、Q2〜Q4 の Inception 質問は処理しない（pending に積み直しもしない）。Lifecycle を `blocked` で報告し、「ユーザーがキャンセルを選択しました。`SPEC_PATH` は変更されていません」と案内して終了する。
    - **上書き時挙動**: ユーザーが Q1 で「上書き」を選んだ場合、既存 spec を `PREVIOUS_SPEC_PATH` に退避してから、下表の**上書き時データ引き継ぎポリシー**に従って新 spec を書き込む。Q2〜Q4 の Inception 回答は「質問機能プロトコル」Step 5/6 に従い一括反映する。

### 上書き時データ引き継ぎポリシー

既存 spec の各フィールドの扱いは以下に統一する。「既存内容は全て `spec.previous.json` に退避し、新 spec は最小 shape から開始する」が原則。

| フィールド | 既存値の扱い | 理由 |
|---|---|---|
| `meta.lang` | 保持 | 同一言語で初期化する |
| `meta.name` | 新規入力から再導出 | 新しいプロダクト概要を起点にする |
| `meta.version` | `"0.1.0"` に再初期化 | 新規プロダクトとして扱う |
| `meta.approved` | 必ず `false` にリセット | 新仕様には承認が必要 |
| `meta.audience` / `meta.intent` | 退避して空で再初期化 | Inception をやり直す |
| `requirements` | 退避して `[]` で再初期化 | Inception をやり直す |
| `tech.*` | 退避して全 6 フィールドを `""` で再初期化 | Construction をやり直す |
| `entities` / `views` / `flows` | 退避して `{}` で再初期化 | Construction をやり直す |

これにより、新しいプロダクト概要に対する Inception → Construction を最初からやり直せる。
13. Extract only explicit Inception data:
    - If audience tags are explicit, populate `meta.audience`.
    - If a product intent is explicit, populate `meta.intent`.
    - If user stories are explicit, populate `requirements`.
14. Extract only explicit Construction data:
    - If an entity is explicitly named, add it under `entities`.
    - If a field is explicitly named and its type is clear, add it.
    - If a field exists but type is unclear, create a question instead of guessing.
    - If a view or flow is not explicit, leave it absent and create the next needed question.
15. Generate Inception pending questions for missing decisions (audience / intent / requirements) **before** any Construction questions.
16. Do **not** generate `tech` pending questions during init unless brownfield repository files provide unambiguous values. Tech は要件確定後の後続 reforge-resume / reforge-answer 呼び出しで補完する。
17. De-duplicate pending questions by normalized `resolves`.
18. Write `SPEC_PATH` and `QUESTIONS_PATH` only after the Quality Gate passes.
19. Apply the question presentation protocol (see 「質問機能プロトコル」) once and stop.

## Unknown Handling Rules

Create questions rather than guessing for:

- Target audience (`meta.audience`).
- Product intent (`meta.intent`).
- User-story style requirements (`requirements`).
- Usage context (`context.mode`) when greenfield vs brownfield is unclear.
- Brownfield change scope, allowed write areas, protected areas, existing conventions, acceptance criteria, and risks.
- Primary entity name.
- Entity fields.
- Field types.
- Required vs optional fields.
- Enum options.
- Initial views.
- User flows.
- Tech stack subfields (frontend/backend/database/orm/styling/testing) — **only after requirements are non-empty**.
- Any destructive overwrite.

Representative questions:

- English: `Who are the primary users of this product?`
- Japanese: `このプロダクトの主なターゲットユーザーは誰ですか？`
- English: `What problem does this product solve for them?`
- Japanese: `このプロダクトはユーザーのどんな課題を解決しますか？`

## Inception Question Generation

### Step A: audience 質問生成

`meta.audience` が空配列の場合、以下を pending に追加する:

```json
{
  "id": "define_audience",
  "phase": "audience",
  "question": "このプロダクトの主なターゲットユーザーは誰ですか？（複数選択可。分からなければ「分からない・AI におまかせ」を選んでください）",
  "type": "multi_choice",
  "resolves": ["meta.audience"]
}
```

選択肢は `meta.lang` に従い、最低でも「個人ユーザー / チーム・組織 / 開発者 / その他（自由記述） / **分からない・AI におまかせ**」を含める（Audience and Style 節の必須ルール）。「分からない・AI におまかせ」が選択された場合、`meta.audience` は空配列のまま保持し、`/reforge-plan` 以降で AI が推奨する。

### Step B: intent 質問生成

`meta.intent` が空文字の場合、以下を pending に追加する:

```json
{
  "id": "define_intent",
  "phase": "intent",
  "question": "このプロダクトはユーザーのどんな課題を解決しますか？（1〜2文。分からない場合は「分からない・AI におまかせ」とだけ書いてOK）",
  "type": "text",
  "resolves": ["meta.intent"]
}
```

自由記述型でも「分からない・AI におまかせ」と書ける旨を質問文に明記する。回答が「分からない・AI におまかせ」だった場合、`meta.intent` は空文字のまま保持する。

### Step C: requirements 質問生成

`requirements` が空配列の場合、以下を pending に追加する:

```json
{
  "id": "define_requirements",
  "phase": "requirements",
  "question": "MVP で満たすべきユーザーストーリーを 3〜5 件挙げてください（『〜として、〜したい、なぜなら〜』形式。分からない場合は「分からない・AI におまかせ」とだけ書いてOK）",
  "type": "multi_input",
  "resolves": ["requirements"]
}
```

「分からない・AI におまかせ」が回答された場合、`requirements` は空配列のまま保持する。

## Construction Question Generation (deferred)

`requirements` が 1 件以上ある場合に限り、Construction 段階の質問を生成できる。生成順序は `views → flows → data → tech` の順を厳守する。

### Views Question Generation

#### Step V1: 画面リスト質問

`views` が空またはキーが0件の場合、以下を pending に追加する:

```json
{
  "id": "define_views_list",
  "phase": "views",
  "question": "このプロダクトに必要な画面を教えてください（例: ホーム、ジョブ一覧、ジョブ詳細、投入フォーム）。画面ごとに1行で書いてください。分からない場合は「分からない・AI におまかせ」とだけ書いてOK。",
  "type": "multi_input",
  "resolves": ["views"]
}
```

#### Step V2: 画面詳細質問（整合性チェックで生成）

`views` にキーが追加された後、キーごとに詳細情報が未定義の場合は以下の詳細質問を生成する（`view_detail_{view_id}` として）:

```json
{
  "id": "view_detail_{view_id}",
  "phase": "views",
  "question": "「{view名}」画面について教えてください（分からない項目は空欄のままOK）:\n1. 目的 — 誰がどんな目的で使う画面か\n2. 表示データ — 何を表示するか（一覧？詳細？グラフ？）\n3. ユーザーアクション — 実行できる操作（ボタン・リンク・フォーム送信など）\n4. フォーム項目 — 入力フォームがある場合の入力項目と必須/任意\n5. 遷移先 — アクション後にどの画面へ移動するか\n6. エラー表示 — 失敗時にどのように伝えるか",
  "type": "text",
  "resolves": ["views.{view_id}"]
}
```

### Flows Question Generation

#### Step F1: フローリスト質問

`flows` が空またはキーが0件の場合、以下を pending に追加する:

```json
{
  "id": "define_flows_list",
  "phase": "flows",
  "question": "主なユーザーフロー（画面間の操作の流れ）を教えてください（例: ログインフロー、ジョブ投入フロー、結果確認フロー）。フローごとに1行で書いてください。分からない場合は「分からない・AI におまかせ」とだけ書いてOK。",
  "type": "multi_input",
  "resolves": ["flows"]
}
```

#### Step F2: フロー詳細質問（整合性チェックで生成）

`flows` にキーが追加された後、キーごとに詳細情報が未定義の場合は以下の詳細質問を生成する（`flow_detail_{flow_id}` として）:

```json
{
  "id": "flow_detail_{flow_id}",
  "phase": "flows",
  "question": "「{flow名}」フローについて教えてください（分からない項目は空欄のままOK）:\n1. 開始条件 — 何をきっかけに始まるか（ボタン押下？画面遷移？外部イベント？）\n2. 主な手順 — ユーザーの操作ステップ（ステップ1: …、ステップ2: …）\n3. 正常終了 — 成功時の状態・表示\n4. エラー時 — 失敗時の表示・リカバリ方法",
  "type": "text",
  "resolves": ["flows.{flow_id}"]
}
```

### Data / Entities Question Generation

`views` と `flows` が確定した後（空でない場合）、永続化が必要なエンティティを問う:

```json
{
  "id": "define_data_entities",
  "phase": "data",
  "question": "画面とフローをもとに、保存が必要なデータ（エンティティ）を教えてください（例: ユーザー、ジョブ、結果レポート）。エンティティごとに1行で書いてください。分からない場合は「分からない・AI におまかせ」とだけ書いてOK。",
  "type": "multi_input",
  "resolves": ["entities"]
}
```

### Tech Field Question Generation

`spec.json` の `tech` セクションには 6 つの必須サブフィールドがある: `frontend`, `backend`, `database`, `orm`, `styling`, `testing`。

各サブフィールドについて、プロダクト説明と既知の要件から推測不能な場合は `questions.json` の `pending` 配列へ質問エントリを追加する。

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
- `question`: `meta.lang` に従ったローカライズ済み質問文
- `type`: `"single_choice"` または `"text"` — 選択肢が明確な場合は `"single_choice"`、自由記述の場合は `"text"`
- `resolves`: `["tech.{field}"]` — 例: `["tech.frontend"]`

#### 6 サブフィールドと推奨質問文（非エンジニア対応・選択肢必須）

各 tech 質問は **`single_choice` 型** とし、推奨選択肢に加えて **「分からない・AI におまかせ」を必ず含める**。専門用語には日本語平易表現を併記する。

| フィールド | id | 推奨質問文（平易説明併記） | 推奨選択肢例（末尾は固定） |
|---|---|---|---|
| `frontend` | `define_tech_frontend` | フロントエンドフレームワーク（画面の作り方）は何を使いますか？ | Next.js / Remix / SvelteKit / **分からない・AI におまかせ** |
| `backend` | `define_tech_backend` | バックエンドの言語・フレームワーク（サーバー側の作り方）は？ | Node.js + Express / Python + FastAPI / Go + Gin / **分からない・AI におまかせ** |
| `database` | `define_tech_database` | データベース（情報の保管庫）は？ | PostgreSQL / MySQL / SQLite / **分からない・AI におまかせ** |
| `orm` | `define_tech_orm` | ORM またはデータアクセス層（DB との橋渡し）は？ | Prisma / Drizzle / TypeORM / **分からない・AI におまかせ** |
| `styling` | `define_tech_styling` | スタイリング（見た目の作り方）は？ | Tailwind CSS / CSS Modules / styled-components / **分からない・AI におまかせ** |
| `testing` | `define_tech_testing` | テストフレームワーク（動作確認の仕組み）は？ | Vitest / Jest / Playwright / **分からない・AI におまかせ** |

#### 「分からない・AI におまかせ」選択時の挙動

- 当該 `tech.<field>` は `""` のままで保持する（仮値を入れない）。
- 質問は `answered` に移動し、`answer: "分からない・AI におまかせ"` を記録。
- `/reforge-plan` および `/reforge-impl` 実行時、AI が当該フィールドの推奨スタックを提案する（ユーザーは再度確認できる）。

#### 例: フロントエンドが推測不能な場合

```json
{
  "id": "define_tech_frontend",
  "phase": "tech",
  "question": "フロントエンドフレームワーク（画面の作り方）は何を使いますか？",
  "type": "single_choice",
  "resolves": ["tech.frontend"]
}
```

#### 重複排除

`resolves` が同一の質問が `pending` にすでに存在する場合は追加しない（de-duplicate by normalized `resolves`）。

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

If this init run includes answers to the questions it just presented, or if the runtime resumes the same command with those answers:

1. Identify the pending questions being answered (up to 4 in a batch).
2. Apply each answer only to paths listed in its `resolves`.
3. If an answer is insufficient for every `resolves` path, do not mutate those paths in `SPEC_PATH`; leave the question in `pending` and skip just that question.
4. For each fully resolved question:
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
- Changed artifacts: `SPEC_PATH`, `QUESTIONS_PATH`, optionally `PREVIOUS_SPEC_PATH`.
- Pending question count and current Inception/Construction phase.
- Next gate:
  - If pending count is 0: `/reforge-validate`.
  - If pending count is 1 or more: answer the AskUserQuestion batch or run `/reforge-resume`.
