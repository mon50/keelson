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
- `SPEC_PATH = ".reforge/spec.json"`
- `QUESTIONS_PATH = ".reforge/questions.json"`
- `PREVIOUS_SPEC_PATH = ".reforge/spec.previous.json"`

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
- `core_schema_compliant`: Writes must preserve `meta`, `tech`, `entities`, `flows`, and `views` in `spec.json`, and `pending`, `answered` in `questions.json`.
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

- Any written spec has `meta.name`, `meta.version`, `meta.lang`, `meta.approved`, `tech`, `entities`, `flows`, and `views`.
- Any written field type is one of `string`, `number`, `date`, `enum`, `text`, `boolean`.
- Any written enum has at least one string option.
- Any written question entry has `id`, `phase`, `question`, `type`, and `resolves`.
- `pending` does not contain duplicate unresolved questions for the same normalized `resolves` set.
- The response includes lifecycle stage, changed artifacts, pending count, and the next gate.

## Command Flow

1. Require a change request argument. If missing, ask for one change request and stop.
2. Read `SPEC_PATH`.
   - If missing, block and report that `/reforge:init "<description>"` is required before update.
   - If invalid JSON, block and report the file that must be fixed.
3. Read `QUESTIONS_PATH` if present; otherwise start from `{ "pending": [], "answered": [] }`.
4. Classify the change request:
   - `add`: adds a new entity, field, view, or flow.
   - `modify`: changes an existing explicit spec path.
   - `remove`: removes an existing explicit spec path.
   - `conflict`: contradicts existing spec.
   - `ambiguous`: lacks required details.
5. If the change can be applied safely:
   - Save the current parsed spec to `PREVIOUS_SPEC_PATH` before writing changes.
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

## Minimal Diff Example

変更指示: `日報のstatusにarchivedを追加して`

適用前の `SPEC_PATH` は、更新を書き込む前に必ず `PREVIOUS_SPEC_PATH`（`.reforge/spec.previous.json`）へ保存する。

更新前:

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
    "backend": "Node.js",
    "database": "PostgreSQL",
    "orm": "Prisma",
    "styling": "Tailwind CSS",
    "testing": "Vitest"
  },
  "entities": {
    "report": {
      "fields": {
        "title": { "type": "string", "required": true },
        "status": { "type": "enum", "options": ["draft", "submitted"] },
        "body": { "type": "text" }
      }
    }
  },
  "views": {
    "reportList": {
      "type": "list",
      "entity": "report",
      "fields": ["title", "status"]
    }
  },
  "flows": {
    "submitReport": {
      "steps": ["日報を作成する", "提出する"]
    }
  }
}
```

更新後:

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
    "backend": "Node.js",
    "database": "PostgreSQL",
    "orm": "Prisma",
    "styling": "Tailwind CSS",
    "testing": "Vitest"
  },
  "entities": {
    "report": {
      "fields": {
        "title": { "type": "string", "required": true },
        "status": { "type": "enum", "options": ["draft", "submitted", "archived"] },
        "body": { "type": "text" }
      }
    }
  },
  "views": {
    "reportList": {
      "type": "list",
      "entity": "report",
      "fields": ["title", "status"]
    }
  },
  "flows": {
    "submitReport": {
      "steps": ["日報を作成する", "提出する"]
    }
  }
}
```

この例で変更してよい JSON パスは `entities.report.fields.status.options` のみ。`meta`、`tech`、`entities.report.fields.title`、`views`、`flows` は更新対象外として同一内容を保持する。

## Question Rules

- New update questions use `phase: "update"` unless they clearly belong to `data`, `view`, or `flow`.
- Question `resolves` must point to the spec path blocked by the change.
- Present only the highest-priority new or existing pending question.

## Completion Report

Report concisely:

- Lifecycle stage: `updated`, `question_needed`, or `blocked`.
- Changed artifacts: `SPEC_PATH`, `QUESTIONS_PATH`, `PREVIOUS_SPEC_PATH`, or `none`.
- Changed spec paths when a patch was applied.
- Pending question count.
- Next gate:
  - If pending count is 0: `/reforge:validate`.
  - If pending count is greater than 0: answer the presented question or run `/reforge:resume`.
