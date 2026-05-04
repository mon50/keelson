---
name: reforge-validate
description: /reforge:validate で .reforge/spec.json と任意の .reforge/questions.json を検証し、全エラーを一括報告する。
allowed-tools: Read, Glob
---

# reforge-validate

## Core Rule

- Think in English, respond to the user in the language specified by `meta.lang`.
- Do not invent missing spec data and do not silently repair invalid input.
- Read `.reforge/spec.json` as the required validation target.
- Read `.reforge/questions.json` only when the file exists.

## Prerequisites

<!-- `.reforge/` 配下のパスは変更してはならない。全コンポーネントが標準パスとして依存するため。 -->

- `.reforge/` は Reforge ワークスペースファイルの標準ディレクトリである。validate はこの標準パスを前提に読み取り、別パスを推測しない。
- 標準ファイル:
  - `.reforge/spec.json`: プロダクト仕様の Single Source of Truth。`meta`, `tech`, `entities`, `views`, `flows` を保持する。
  - `.reforge/spec.previous.json`: 直前の spec スナップショット。diff 操作で現在の `spec.json` と比較するために使う。
  - `.reforge/questions.json`: 質問キュー。`pending` と `answered` を保持し、全コマンドが不明点の追加・解決状態を共有する。
  - `.reforge/tasks.json`: 実装タスクキュー。`/reforge:plan` が entity 単位タスクを生成し、`/reforge:impl` が消化する。
- `.reforge/` 配下のパスは変更してはならない。engine / renderer / impl / installer / validate が同じ標準パスに依存する。

## Canonical Paths

- `REFORGE_DIR = ".reforge"`
- `SPEC_PATH = ".reforge/spec.json"`
- `PREVIOUS_SPEC_PATH = ".reforge/spec.previous.json"`
- `QUESTIONS_PATH = ".reforge/questions.json"`
- `TASKS_PATH = ".reforge/tasks.json"`

## Output Contract

- If no errors, warnings, or infos exist, output exactly `✔ valid`.
- If any error exists, output one `✖ incomplete: ...` line per failure.
- If any warning exists, output one `⚠ warning: ...` line per warning.
- If any info exists, output one `ℹ info: ...` line per info.
- Keep the status marker literal for consistency. Localize the explanation text after the marker.
- Use the same literal success marker in both languages:
  - English success: `✔ valid`
  - Japanese success: `✔ valid`
- Choose explanation language as follows:
  - If parsed `meta.lang` is exactly `ja`, use Japanese.
  - If parsed `meta.lang` is exactly `en` or missing, use English.
  - If `meta.lang` is invalid, default to English unless the raw value is exactly `ja`.

## Validation Flow

1. Step 1: ファイル読み取り
   - `.reforge/spec.json` の存在を確認し、JSONとして読み取る。
   - `.reforge/questions.json` は存在する場合のみ読み取り対象にする。
   - 必須の `spec.json` が存在しない、またはJSONとして解析できない場合は、その失敗を報告して停止する。解析済みのspec objectなしでは後続検証を実行できない。
2. Step 2: スキーマ準拠検証
   - `meta.lang` から応答言語を決定する。
   - `spec.json` がJSON objectであることを確認する。
   - 必須最上位セクションとして `meta`, `tech`, `entities`, `views`, `flows` がすべて存在することを確認する。
   - 欠如している必須最上位セクションごとに `errors` リストへ次のエラーを追加し、最初の欠如で停止せず残りのセクション確認と後続Stepの検証を継続する。
     - code: `SCHEMA_MISSING_SECTION`
     - path: `<SectionName>`
     - 英語メッセージ形式: `top-level section '<SectionName>' is required`
     - 日本語メッセージ形式: `トップレベルセクション '<SectionName>' は必須です`
   - `meta`, `tech`, `entities`, `views`, `flows` はobjectでなければならない。存在するセクションだけ詳細構造を検証し、欠如セクションがあっても他セクションの検証は継続する。
   - `.reforge/spec.json` のサンプルに `meta`, `tech`, `entities`, `views`, `flows` がすべて存在する場合、このStep 2は `SCHEMA_MISSING_SECTION` を `errors` に追加せず通過する。
   - トップレベル構造、`meta`、`tech`、`entities`、field定義、`flows`、`views` の必須構造と型を検証する。
3. Step 3: techセクション検証
   - `tech` セクションが存在することを確認する。`tech` セクションが欠如している場合は、Step 2 の `SCHEMA_MISSING_SECTION` エラーとして `errors` に追加済みであることを確認する。
     - code: `SCHEMA_MISSING_SECTION`
     - path: `tech`
     - 英語メッセージ形式: `top-level section 'tech' is required`
     - 日本語メッセージ形式: `トップレベルセクション 'tech' は必須です`
   - `tech` が欠如している、または object ではない場合でも後続Stepの検証は継続する。存在しない `tech` からサブフィールド値を推測して補完してはならない。
   - `tech` が object として存在する場合、次の6サブフィールドの存在を1つずつ確認する。
     - `frontend` (`tech.frontend`)
     - `backend` (`tech.backend`)
     - `database` (`tech.database`)
     - `orm` (`tech.orm`)
     - `styling` (`tech.styling`)
     - `testing` (`tech.testing`)
   - 欠如している tech サブフィールドごとに `errors` リストへ次のエラーを追加し、最初の欠如で停止せず残りの tech サブフィールド確認と後続Stepの検証を継続する。
     - code: `TECH_MISSING_FIELD`
     - path: `tech.<FieldName>`
     - field: `<FieldName>`
     - 英語メッセージ形式: `tech.<FieldName> is required`
     - 日本語メッセージ形式: `tech.<FieldName> は必須です`
   - 6サブフィールドがすべて存在し、かつ string である場合、このStep 3は `TECH_MISSING_FIELD` を `errors` に追加せず通過する。
4. Step 4: meta.approved検証
   - `meta.approved` がbooleanで存在することを検証する。
   - `meta.approved` の値を読み取り、承認状態として `true` / `false` を記録する。
   - `meta.approved` が `false` の場合、`infos` リストへ次の情報を追加する。
     - code: `NOT_APPROVED`
     - severity: `info`
     - path: `meta.approved`
     - 英語メッセージ形式: `meta.approved is false; run /reforge:render to review and approve the UI prototype`
     - 日本語メッセージ形式: `meta.approved が false です。/reforge:render でUIプロトタイプを確認・承認してください`
   - `NOT_APPROVED` は `error` ではなく `info` として分類し、通常の `/reforge:validate` では `errors` リストに追加しない。
   - plan/impl 実行要求時に `meta.approved` が `false` の場合は承認ゲート違反のエラーとして扱い、`/reforge:plan` と `/reforge:impl` を実行しない。
   - `meta.approved: false` のスペックでは、通常 validate の出力に `NOT_APPROVED` 情報が報告されることを確認する。
5. Step 5: 参照整合性検証
   - `views` 内の `entity` 参照が `entities` に存在することを検証する。
   - `flows` 内で明示された entity 参照が `entities` に存在することを検証する。
6. Step 6: questions.json検証
   - `.reforge/questions.json` が存在しない場合は質問検証をスキップする。
   - 存在する場合は `pending` / `answered` の形式を検証し、`pending` に未解決質問が残っていれば報告する。
7. Step 7: 結果報告
   - Step 2〜6 の `errors` / `warnings` / `infos` は最初の1件で停止せず、すべて収集してから返す。
   - `errors` がある場合は1件ごとに `✖ incomplete: ...` 行を返す。
   - `warnings` がある場合は1件ごとに `⚠ warning: ...` 行を返す。
   - `infos` がある場合は1件ごとに `ℹ info: ...` 行を返す。`NOT_APPROVED` は `ℹ info: [NOT_APPROVED] ...` として報告する。
   - `errors` / `warnings` / `infos` がすべて空の場合に限り `✔ valid` を返す。

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
- `meta.approved is false; run /reforge:render to review and approve the UI prototype`
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
- `meta.approved が false です。/reforge:render でUIプロトタイプを確認・承認してください`
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

### Complete Starter Before Approval

- `spec.json` contains `meta.name`, `meta.version`, `meta.lang`, `meta.approved`, all `tech` fields, and empty `entities`, `flows`, `views`.
- `meta.approved` is `false`.
- `questions.json` is absent, or present with empty `pending` and `answered`.
- Result: one info line reporting `NOT_APPROVED` and prompting `/reforge:render`.

### Valid Approved Spec

- `spec.json` contains `meta.name`, `meta.version`, `meta.lang`, `meta.approved`, all `tech` fields, and empty `entities`, `flows`, `views`.
- `meta.approved` is `true`.
- `questions.json` is absent, or present with empty `pending` and `answered`.
- Result: `✔ valid`

### Plan/Impl Gate

- `meta.approved` is `false` by default.
- `/reforge:plan` and `/reforge:impl` must not execute while `meta.approved` is `false`.
- `/reforge:plan` and `/reforge:impl` may execute only after `meta.approved` is `true`.
- If the caller requested plan/impl execution, `meta.approved: false` is an error gate even though ordinary validate reports `NOT_APPROVED` as info.

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
