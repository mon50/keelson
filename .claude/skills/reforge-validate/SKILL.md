---
name: reforge-validate
description: Validate a Reforge spec from .reforge/spec.json and the optional .reforge/questions.json queue.
allowed-tools: Read, Glob
---

# reforge-validate

## Core Rule

- Think in English, respond to the user in the language specified by `meta.lang`.
- Do not invent missing spec data and do not silently repair invalid input.
- Read `.reforge/spec.json` as the required validation target.
- Read `.reforge/questions.json` only when the file exists.

## Canonical Paths

- `REFORGE_DIR = ".reforge"`
- `SPECS_DIR = ".reforge/specs"`
- `SPEC_PATH = ".reforge/specs/<name>/spec.json"` (resolved by Spec Resolution)
- `QUESTIONS_PATH = ".reforge/specs/<name>/questions.json"`

## Spec Resolution (reforge-validate [<spec-name>])

1. 引数で spec 名が渡された場合 → `.reforge/specs/<name>/` が存在すれば使用、なければエラー報告して `blocked`。
2. 引数なし + `.reforge/specs/` 内の spec が 1 つ → 自動選択して続行。
3. 引数なし + specs が複数 → 一覧表示して AskUserQuestion で選択を求める。
4. 引数なし + specs が 0 → `/reforge-init "<説明>"` を案内して `blocked`。

選択された spec 名を `<name>` として Canonical Paths を解決する。

## Prerequisites

このスキルは以下のファイルを読み取る。`.reforge/` 配下のパスは変更してはならない。

| ファイル | 役割 |
|---|---|
| `.reforge/spec.json` | プロダクト仕様（Single Source of Truth） |
| `.reforge/spec.previous.json` | 直前のspecスナップショット（diff用） |
| `.reforge/questions.json` | 質問キュー（pending / answered） |
| `.reforge/tasks.json` | 実装タスクキュー（entity単位のタスク） |

## Output Contract

- If no errors exist, output exactly `✔ valid`.
- If any error exists, output one `✖ incomplete: ...` line per failure.
- Keep the status marker literal for consistency. Localize the explanation text after the marker.
- Use the same literal success marker in both languages:
  - English success: `✔ valid`
  - Japanese success: `✔ valid`
- Choose explanation language as follows:
  - If parsed `meta.lang` is exactly `ja`, use Japanese.
  - If parsed `meta.lang` is exactly `en` or missing, use English.
  - If `meta.lang` is invalid, default to English unless the raw value is exactly `ja`.

## Validation Flow

以下の7ステップを順に実行する。エラーは途中で停止せず全件収集してから報告する。

1. Step 1: ファイル読み取り — `SPEC_PATH` を読み取り、欠如または不正 JSON なら即時報告して停止する。

2. Step 2: スキーマ準拠検証 — 必須セクション存在チェック

   `.reforge/spec.json` に `meta`、`tech`、`entities`、`views`、`flows` の5セクションが存在するか確認する。
   欠如しているセクションがあれば `errors` リストに追加し、継続する（停止しない）。

   エラーコード: `SCHEMA_MISSING_SECTION`

   | 状況 | 動作 |
   |---|---|
   | すべて存在する | エラーリストに何も追加しない（通過） |
   | セクションが欠如 | `errors` に追加して次セクションへ継続 |

   エラーメッセージ:
   - English: `top-level section '<SectionName>' is required`
   - Japanese: `トップレベルセクション '<SectionName>' は必須です`

3. Step 3: techセクション検証 — tech フィールドの完全性チェック

   `tech` セクションの6フィールド `frontend`、`backend`、`database`、`orm`、`styling`、`testing` が存在し非空文字か確認する。
   欠如または空のフィールドは `errors` に追加し、継続する（停止しない）。

   エラーコード: `TECH_MISSING_FIELD`

   `tech` セクションが欠如している場合（Step 2 で `SCHEMA_MISSING_SECTION` として報告済みの場合）: このステップはスキップして Step 4 へ進む。techセクションが欠如した場合はすでに上流で `トップレベルセクション 'tech' は必須です` / `top-level section 'tech' is required` として報告済みのため、個別フィールドチェックは行わない。

   欠如フィールドのエラーメッセージ:
   - English: `tech.<FieldName> is required`
   - Japanese: `tech.<FieldName> は必須です`

   例: `tech.frontend は必須です` / `tech.frontend is required`
   対象フィールド: `tech.frontend`、`tech.backend`、`tech.database`、`tech.orm`、`tech.styling`、`tech.testing`

4. Step 4: meta.approved検証 — 承認状態の確認と info 報告

   `meta.approved` の値を読み取り、状態に応じて `info` リストへ追加する。

   - `meta.approved` が `false` の場合: `NOT_APPROVED` を `info` リストに追加する。`NOT_APPROVED` は `error` ではなく `info`。ユーザーへのガイダンスとして「`/reforge-render` でUIプロトタイプを確認・承認してください」を表示する。
   - plan/impl 実行要求時: `meta.approved` が `false` の場合はエラーとして扱う（validate コマンド自体では info のみ）。

   メッセージカタログへの追加:
   - `NOT_APPROVED`: `` `meta.approved が false です。/reforge-render でUIプロトタイプを確認・承認してください` ``

   `meta.approved: false` のスペックは `NOT_APPROVED` として報告するが、validate の合否判定には影響しない。

5. Step 5: 参照整合性検証 — views/flows の entity 参照チェック

   `entities` のキー集合を取得し、`views` および `flows` の entity 参照が集合内に存在するか確認する。

   - `views` の各エントリの `entity` フィールドが `entities` に存在するか確認する。
     - `views.<ViewName>.entity` が `entities` に存在しない場合: `REF_INTEGRITY_VIEW` を `errors` に追加。停止せず全件確認する。
   - `flows` の entity 参照が `entities` に存在するか確認する。
     - 無効なentity参照が `flows` にある場合: `REF_INTEGRITY_FLOW` を `errors` に追加。

   無効なentity参照は `REF_INTEGRITY_VIEW` または `REF_INTEGRITY_FLOW` としてエラーに収集する。全件確認してから `errors` に追加する。

6. Step 6: questions.json検証 — 未解決質問の警告

   `.reforge/questions.json` が存在する場合に読み取り、`pending` の件数を確認する。

   - `pending` が 1 件以上の場合: `PENDING_QUESTIONS` を `warnings` リストに追加する。
   - `pending` が 0 件の場合: 警告なし、`✔ valid` の判定に貢献する。

   メッセージフォーマット:
   - English: `<N> unresolved question(s) remain in questions.json pending queue`
   - Japanese: `questions.json の pending キューに未解決の質問が <N> 件残っています`

7. Step 7: 結果報告 — errors / warnings / infos をまとめて出力

   `errors`、`warnings`、`infos` をまとめて報告する。

   - `errors` が 0 件 → `✔ valid`
   - `errors` が 1 件以上 → `✖ invalid` + エラー一覧
   - 警告がある場合: `⚠ warning: ...`
   - NOT_APPROVED info がある場合: `ℹ info: [NOT_APPROVED] ...`

## spec.json Rules

### Top-Level Shape

- `spec.json` must be a JSON object.
- The top-level object must contain `meta`, `entities`, `flows`, and `views`.
- `meta` must be an object.
- `entities`, `flows`, and `views` must be objects.

### meta

- `meta.name` is required and must be a string.
- `meta.version` is required and must be a string.
- `meta.lang` is optional.
- When present, `meta.lang` must be either `en` or `ja`.
- Treat omitted `meta.lang` as default English for output behavior.

### entities

- `entities` is a map from entity name to entity definition.
- Each entity definition must be an object.
- Each entity definition must contain `fields`.
- `fields` must be an object map.
- Each field definition must be an object.
- Each field definition must contain `type`.
- Allowed `type` values are `string`, `number`, `date`, `enum`, `text`, and `boolean`.
- `required` is optional. When present, it must be a boolean.
- If `type` is `enum`, `options` is required and must be an array with at least one string item.

### flows

- `flows` is a map from flow name to flow definition.
- Each flow definition must be an object.
- Each flow definition must contain `steps`.
- `steps` must be an array.

### views

- `views` is a map from view name to view definition.
- Each view definition must be an object.
- Each view definition must contain `type`.
- `type` must be a string.

## questions.json Rules

- If `.reforge/questions.json` does not exist, skip questions validation.
- If the file exists, it must parse as a JSON object.
- The root object must contain `pending` and `answered`.
- `pending` and `answered` must both be arrays.
- Every question entry in either array must be an object containing:
  - `id` as string
  - `phase` as string
  - `question` as string
  - `type` as string
  - `resolves` as an array of strings
- If a question entry is missing `id`, refer to it by queue position such as `pending[0]` or `answered[2]` in the explanation text.
- After format validation, require `pending` to be empty.

## Entity Reference Integrity

- Build the canonical entity-name set from the keys of `entities`.
- Inspect `views` and `flows` recursively.
- Treat values under the following keys as explicit entity references:
  - `entity`
  - `entities`
  - `sourceEntity`
  - `targetEntity`
  - `fromEntity`
  - `toEntity`
- For singular reference keys, accept a string entity name.
- For plural reference keys, accept an array of string entity names.
- If any referenced entity name is not present in the `entities` keys, report an integrity error.
- Do not guess that unrelated free-form strings are entity references.

## Error Message Catalog

Use these phrasings so validation stays consistent.

### English

- `spec.json not found at .reforge/specs/<name>/spec.json`
- `spec.json is not valid JSON`
- `top-level section 'meta' is required`
- `top-level section 'entities' is required`
- `top-level section 'flows' is required`
- `top-level section 'views' is required`
- `meta.name is required`
- `meta.version is required`
- `meta.lang '<value>' is not valid. Allowed values: "en", "ja"`
- `entity '<EntityName>' must define a fields object`
- `field '<EntityName>.<FieldName>' is missing required type`
- `field '<EntityName>.<FieldName>' has invalid type '<value>'. Valid types: string, number, date, enum, text, boolean`
- `field '<EntityName>.<FieldName>' of type 'enum' requires at least one option`
- `field '<EntityName>.<FieldName>.required' must be boolean when present`
- `flow '<FlowName>' must define a steps array`
- `view '<ViewName>' must define a string type`
- `questions.json is not valid JSON`
- `questions.json is missing required 'pending' or 'answered' array`
- `question entry '<QuestionId>' in '<QueueName>' is missing required field '<FieldName>'`
- `question entry '<QuestionId>' in '<QueueName>' must define 'resolves' as an array of strings`
- `<N> unresolved question(s) remain in questions.json pending queue`
- `entity reference '<EntityName>' not found in entities section`

### Japanese

- `.reforge/specs/<name>/spec.json に spec.json が見つかりません`
- `spec.json は有効な JSON ではありません`
- `トップレベルセクション 'meta' は必須です`
- `トップレベルセクション 'entities' は必須です`
- `トップレベルセクション 'flows' は必須です`
- `トップレベルセクション 'views' は必須です`
- `meta.name は必須です`
- `meta.version は必須です`
- `meta.lang '<value>' は無効です。使用できる値は "en" と "ja" のみです`
- `エンティティ '<EntityName>' には fields オブジェクトが必要です`
- `フィールド '<EntityName>.<FieldName>' には type が必要です`
- `フィールド '<EntityName>.<FieldName>' の type '<value>' は無効です。使用できる型は string, number, date, enum, text, boolean です`
- `enum 型のフィールド '<EntityName>.<FieldName>' には 1 件以上の options が必要です`
- `フィールド '<EntityName>.<FieldName>.required' は指定する場合 boolean でなければなりません`
- `フロー '<FlowName>' には steps 配列が必要です`
- `ビュー '<ViewName>' には文字列の type が必要です`
- `questions.json は有効な JSON ではありません`
- `questions.json には 'pending' または 'answered' 配列が必要です`
- `'<QueueName>' 内の質問エントリー '<QuestionId>' には '<FieldName>' が必要です`
- `'<QueueName>' 内の質問エントリー '<QuestionId>' の resolves は文字列配列でなければなりません`
- `questions.json の pending キューに未解決の質問が <N> 件残っています`
- `entities セクションにエンティティ参照 '<EntityName>' が見つかりません`

## Representative Scenarios

Use these as anchors when validating.

### Valid Minimal Starter

- `spec.json` contains `meta.name`, `meta.version`, `meta.lang`, and empty `entities`, `flows`, `views`.
- `questions.json` is absent, or present with empty `pending` and `answered`.
- Result: `✔ valid`

### Invalid Language

- `meta.lang` is `fr`.
- Result: one failure line for invalid `meta.lang`.

### Localized Failure Output

- If `meta.lang` is omitted or `en` and `meta.name` is missing:
  - `✖ incomplete: meta.name is required`
- If `meta.lang` is `ja` and `meta.name` is missing:
  - `✖ incomplete: meta.name は必須です`

### Invalid Field Type

- A field uses `type: "uuid"`.
- Result: one failure line naming the field and the allowed types.

### Invalid enum Definition

- A field uses `type: "enum"` with missing or empty `options`.
- Result: one failure line naming the field.

### Unresolved Questions

- `questions.json` exists and `pending` contains one or more entries.
- Result: one failure line with the unresolved count, after any format errors are also collected.

### Missing Entity Reference

- A view or flow declares an explicit entity reference whose name is absent from `entities`.
- Result: one failure line per missing entity name.

## Data Contract Samples

### spec.json 完全サンプル

`meta.approved` のデフォルト値は `false`。`meta.approved: false` の間は `/reforge-plan` と `/reforge-impl` を実行してはならない。`meta.approved: true` の場合に限り `/reforge-plan` と `/reforge-impl` を実行できる。

フィールド型一覧:

| 型 | 説明 |
|---|---|
| `string` | 文字列 |
| `number` | 数値 |
| `date` | 日付 |
| `enum` | 列挙値（optionsが必須） |
| `text` | 長文テキスト |
| `boolean` | 真偽値 |

```json
{
  "meta": { "name": "daily-report", "version": "0.1.0", "lang": "ja", "approved": false },
  "tech": { "frontend": "Next.js", "backend": "Node.js / Express", "database": "PostgreSQL", "orm": "Prisma", "styling": "Tailwind CSS", "testing": "Vitest" },
  "entities": {
    "report": {
      "fields": {
        "title": { "type": "string", "required": true },
        "score": { "type": "number" },
        "reportedAt": { "type": "date" },
        "status": { "type": "enum", "options": ["draft", "submitted"] },
        "body": { "type": "text" },
        "published": { "type": "boolean" }
      }
    }
  },
  "views": { "reportList": { "type": "list", "entity": "report", "fields": ["title", "status", "reportedAt"] } },
  "flows": { "submitReport": { "steps": ["Create report", "Review report", "Submit report"] } }
}
```

### questions.json サンプル

質問フェーズ一覧:

| フェーズ | 説明 |
|---|---|
| `meta` | プロダクトメタ情報 |
| `tech` | 技術スタック |
| `data` | エンティティ・フィールド定義 |
| `views` | 画面定義 |
| `flows` | ユーザーフロー |

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
  "answered": [
    {
      "id": "define_entity_name",
      "phase": "data",
      "question": "管理する主なデータ（エンティティ）の名前は？",
      "type": "text",
      "resolves": ["entities"],
      "answer": "report"
    }
  ]
}
```

### tasks.json サンプル

タスク粒度は entity 単位（DB + API + UI + テスト）。

タスクステータス一覧:

| ステータス | 説明 |
|---|---|
| `pending` | 未着手 |
| `in_progress` | 進行中 |
| `done` | 完了 |

サブタスク一覧:

| サブタスク | 説明 |
|---|---|
| `db` | DBマイグレーション |
| `api` | APIエンドポイント |
| `ui` | UIコンポーネント |
| `test` | テストファイル |

```json
{
  "tasks": [
    { "id": "report", "entity": "report", "status": "pending", "subtasks": ["db", "api", "ui", "test"] }
  ]
}
```

`.reforge/tasks.json` には全エンティティのタスクが格納される。`.reforge/` 配下のパスは変更してはならない。
