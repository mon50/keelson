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
   - `entities`
   - field definitions
   - `flows`
   - `views`
   - optional `questions.json`
   - entity-reference integrity inside `views` and `flows`
6. Return `✔ valid` when the error list is empty. Otherwise return one `✖ incomplete: ...` line per error.

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

- `spec.json not found at .reforge/spec.json`
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

- `.reforge/spec.json に spec.json が見つかりません`
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
