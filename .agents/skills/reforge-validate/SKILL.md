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
- `SPEC_PATH = ".reforge/spec.json"`
- `QUESTIONS_PATH = ".reforge/questions.json"`
- `TASKS_PATH = ".reforge/tasks.json"`

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

1. Check whether `.reforge/spec.json` exists.
2. Parse `.reforge/spec.json` as JSON.
3. If the required file is missing or unreadable JSON, report that failure and stop. No downstream spec checks are possible without a parsed spec object.
4. Determine the response language from `meta.lang`.
5. Collect all remaining validation errors before responding:
   - top-level structure
   - `meta`
   - `tech`
   - `entities`
   - field definitions
   - `flows`
   - `views`
   - `meta.approved` gate status
   - optional `questions.json`
   - entity-reference integrity inside `views` and `flows`
6. Return `✔ valid` when the error list is empty. Otherwise return one `✖ incomplete: ...` line per error.

## spec.json Schema Comment

このセクションは `spec.json` スキーマの正本コメントである。`reforge-validate` は不足値を推測せず、無言で補完しない。新規 `spec.json` を作る場合、`meta.approved` のデフォルト値は `false` とする。

### Complete spec.json Sample

```json
{
  "meta": {
    "name": "日報アプリ",
    "version": "0.1.0",
    "lang": "ja",
    "approved": false
  },
  "tech": {
    "frontend": "Next.js",
    "backend": "Node.js / Express",
    "database": "PostgreSQL",
    "orm": "Prisma",
    "styling": "Tailwind CSS",
    "testing": "Vitest"
  },
  "entities": {
    "report": {
      "fields": {
        "title": { "type": "string", "required": true },
        "score": { "type": "number" },
        "reportedAt": { "type": "date", "required": true },
        "status": { "type": "enum", "required": true, "options": ["draft", "submitted"] },
        "body": { "type": "text" },
        "published": { "type": "boolean" }
      }
    }
  },
  "views": {
    "reportForm": {
      "type": "form",
      "entity": "report",
      "fields": ["title", "reportedAt", "status", "body"]
    },
    "reportList": {
      "type": "list",
      "entity": "report",
      "fields": ["title", "status", "published"]
    }
  },
  "flows": {
    "submitReport": {
      "steps": [
        "reportをdraftとして作成する",
        "reportの必須フィールドを確認する",
        "report.statusをsubmittedに更新する"
      ]
    }
  }
}
```

### Top-Level Shape

- `spec.json` は JSON object でなければならない。
- トップレベルには `meta`, `tech`, `entities`, `views`, `flows` の全セクションが必須である。
- `meta`, `tech`, `entities`, `views`, `flows` は object でなければならない。

### meta

- `meta.name` は必須で、string でなければならない。
- `meta.version` は必須で、string でなければならない。
- `meta.lang` は必須で、string でなければならない。
- `meta.lang` の有効値は `en` または `ja` である。
- `meta.approved` は必須で、boolean でなければならない。
- `meta.approved` のデフォルト値は `false` である。UIプロトタイプ承認前の新規仕様では `false` を明示する。

### Approval Gate

- `meta.approved: false` の間は `/reforge:plan` と `/reforge:impl` を実行してはならない。
- `meta.approved: true` の場合に限り `/reforge:plan` と `/reforge:impl` を実行できる。
- plan/impl 実行前提として検証する呼び出しで `meta.approved` が `false` の場合、ゲート違反として報告する。

### tech

- `tech` は plan/impl がゼロコンテキストで実装するための必須セクションである。
- `tech.frontend`, `tech.backend`, `tech.database`, `tech.orm`, `tech.styling`, `tech.testing` はすべて必須で、string でなければならない。
- `tech` は entity 単位の DB schema、API endpoint、UI component、test を追加質問なしで生成できるだけの技術スタック情報を提供する。

### entities

- `entities` は entity 名から entity definition への map である。
- 各 entity definition は object で、`fields` object map を必ず持つ。
- 各 field definition は object で、`type` を必ず持つ。
- `required` は任意で、指定する場合は boolean でなければならない。
- `required: true` の field 値が対象データに存在しない場合は validation error として扱う。

### Field Types

| Type | Constraint |
|---|---|
| `string` | 短い単一行テキスト。値は JSON string として扱う。 |
| `number` | 数値。値は JSON number として扱い、数値文字列で代用しない。 |
| `date` | 日付または日時。値は JSON string として扱い、保存・表示形式が曖昧な場合は質問で確定する。 |
| `enum` | 列挙値。`options` array が必須で、1件以上の string 値を持つ。値は `options` のいずれかでなければならない。 |
| `text` | 複数行または長文の自由入力テキスト。値は JSON string として扱う。 |
| `boolean` | 真偽値。値は JSON boolean (`true` / `false`) として扱う。 |

### views

- `views` は view 名から view definition への map である。
- 各 view definition は object で、`type` string と `entity` string reference を必ず持つ。
- `fields` は任意で、指定する場合は field 名の string array でなければならない。
- `entity` は `entities` に存在する entity 名を参照しなければならない。

### flows

- `flows` は flow 名から flow definition への map である。
- 各 flow definition は object で、`steps` array を必ず持つ。
- flow 内で明示的に entity を参照する場合、その entity 名は `entities` に存在しなければならない。

## Legacy Validation Rules

### Top-Level Shape

- `spec.json` must be a JSON object.
- The top-level object must contain `meta`, `tech`, `entities`, `flows`, and `views`.
- `meta` must be an object.
- `tech`, `entities`, `flows`, and `views` must be objects.

### meta

- `meta.name` is required and must be a string.
- `meta.version` is required and must be a string.
- `meta.lang` is required and must be a string.
- When present, `meta.lang` must be either `en` or `ja`.
- `meta.approved` is required and must be a boolean.
- Treat omitted `meta.lang` as default English only for output behavior after reporting the missing field.

### tech

- `tech` is required for plan and impl readiness.
- `tech.frontend`, `tech.backend`, `tech.database`, `tech.orm`, `tech.styling`, and `tech.testing` are required strings.
- Do not choose or repair missing technology values during validation.

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
- Each view definition must contain `entity`.
- `entity` must be a string reference to a key in `entities`.
- `fields` is optional. When present, it must be an array of strings.

## questions.json Rules

このセクションは `.reforge/questions.json` の正本コメントである。`questions.json` は全コマンド共有の質問キューであり、不明点を推測で補完せず `pending` に積み、回答後に `answered` へ移動する。

### questions.json 完全サンプル

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

### questions.json 形式

- 保存パスは `.reforge/questions.json` であり、すべての Reforge コマンドが共有する。
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
- `pending` の質問が回答されたら、同じ質問エントリに `answer` フィールドを追加して `answered` へ移動する。
- If a question entry is missing `id`, refer to it by queue position such as `pending[0]` or `answered[2]` in the explanation text.
- After format validation, require `pending` to be empty.

### phase 有効値

| 値 | 意味 |
|---|---|
| `meta` | `meta` セクションに関する質問 |
| `tech` | `tech` セクションに関する質問 |
| `data` | `entities` とデータモデルに関する質問 |
| `views` | `views` セクションに関する質問 |
| `flows` | `flows` セクションに関する質問 |

## tasks.json Rules

このセクションは `.reforge/tasks.json` の正本コメントである。`/reforge:plan` が entity 単位の実装タスクを生成し、`/reforge:impl` が `status` と `subtasks` を読み取って消化する。

### tasks.json 完全サンプル

```json
{
  "tasks": [
    {
      "id": "report",
      "entity": "report",
      "status": "pending",
      "subtasks": ["db", "api", "ui", "test"]
    }
  ]
}
```

### tasks.json 形式

- 保存パスは `.reforge/tasks.json` である。
- ルートオブジェクトはトップレベルに `tasks` 配列を持つ。
- 各タスクエントリは object で、次のフィールドを必ず持つ。
  - `id`: string
  - `entity`: string
  - `status`: `pending`, `in_progress`, `done` のいずれか
  - `subtasks`: `db`, `api`, `ui`, `test` の配列
- タスク粒度は entity 単位である。1つのタスクは単一 entity の DB、API、UI、テストをひとまとめに扱う。

### status 有効値

| 値 | 意味 |
|---|---|
| `pending` | 未着手 |
| `in_progress` | 実装中 |
| `done` | 完了 |

### subtasks 有効値

| 値 | 意味 |
|---|---|
| `db` | DBスキーマ / マイグレーション |
| `api` | APIエンドポイント / サーバーロジック |
| `ui` | UIコンポーネント / 画面 |
| `test` | 自動テスト |

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

- `spec.json not found at .reforge/spec.json`
- `spec.json is not valid JSON`
- `top-level section 'meta' is required`
- `top-level section 'tech' is required`
- `top-level section 'entities' is required`
- `top-level section 'flows' is required`
- `top-level section 'views' is required`
- `meta.name is required`
- `meta.version is required`
- `meta.lang is required`
- `meta.lang '<value>' is not valid. Allowed values: "en", "ja"`
- `meta.approved is required and must be boolean`
- `meta.approved is false; run /reforge:render and approve the UI prototype before /reforge:plan or /reforge:impl`
- `tech.<FieldName> is required`
- `entity '<EntityName>' must define a fields object`
- `field '<EntityName>.<FieldName>' is missing required type`
- `field '<EntityName>.<FieldName>' has invalid type '<value>'. Valid types: string, number, date, enum, text, boolean`
- `field '<EntityName>.<FieldName>' of type 'enum' requires at least one option`
- `field '<EntityName>.<FieldName>.required' must be boolean when present`
- `flow '<FlowName>' must define a steps array`
- `view '<ViewName>' must define a string type`
- `view '<ViewName>' must define an entity reference`
- `view '<ViewName>.fields' must be an array of strings when present`
- `questions.json is not valid JSON`
- `questions.json is missing required 'pending' or 'answered' array`
- `question entry '<QuestionId>' in '<QueueName>' is missing required field '<FieldName>'`
- `question entry '<QuestionId>' in '<QueueName>' must define 'resolves' as an array of strings`
- `<N> unresolved question(s) remain in questions.json pending queue`
- `entity reference '<EntityName>' not found in entities section`

### Japanese

- `.reforge/spec.json に spec.json が見つかりません`
- `spec.json は有効な JSON ではありません`
- `トップレベルセクション 'meta' は必須です`
- `トップレベルセクション 'tech' は必須です`
- `トップレベルセクション 'entities' は必須です`
- `トップレベルセクション 'flows' は必須です`
- `トップレベルセクション 'views' は必須です`
- `meta.name は必須です`
- `meta.version は必須です`
- `meta.lang は必須です`
- `meta.lang '<value>' は無効です。使用できる値は "en" と "ja" のみです`
- `meta.approved は必須で、boolean でなければなりません`
- `meta.approved が false です。/reforge:plan または /reforge:impl の前に /reforge:render でUIプロトタイプを承認してください`
- `tech.<FieldName> は必須です`
- `エンティティ '<EntityName>' には fields オブジェクトが必要です`
- `フィールド '<EntityName>.<FieldName>' には type が必要です`
- `フィールド '<EntityName>.<FieldName>' の type '<value>' は無効です。使用できる型は string, number, date, enum, text, boolean です`
- `enum 型のフィールド '<EntityName>.<FieldName>' には 1 件以上の options が必要です`
- `フィールド '<EntityName>.<FieldName>.required' は指定する場合 boolean でなければなりません`
- `フロー '<FlowName>' には steps 配列が必要です`
- `ビュー '<ViewName>' には文字列の type が必要です`
- `ビュー '<ViewName>' には entity 参照が必要です`
- `ビュー '<ViewName>.fields' は指定する場合、文字列配列でなければなりません`
- `questions.json は有効な JSON ではありません`
- `questions.json には 'pending' または 'answered' 配列が必要です`
- `'<QueueName>' 内の質問エントリー '<QuestionId>' には '<FieldName>' が必要です`
- `'<QueueName>' 内の質問エントリー '<QuestionId>' の resolves は文字列配列でなければなりません`
- `questions.json の pending キューに未解決の質問が <N> 件残っています`
- `entities セクションにエンティティ参照 '<EntityName>' が見つかりません`

## Representative Scenarios

Use these as anchors when validating.

### Valid Minimal Starter

- `spec.json` contains `meta.name`, `meta.version`, `meta.lang`, `meta.approved`, all `tech` fields, and empty `entities`, `flows`, `views`.
- `questions.json` is absent, or present with empty `pending` and `answered`.
- Result: `✔ valid`

### Plan/Impl Gate

- `meta.approved` is `false` by default.
- `/reforge:plan` and `/reforge:impl` must not execute while `meta.approved` is `false`.
- `/reforge:plan` and `/reforge:impl` may execute only after `meta.approved` is `true`.

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
