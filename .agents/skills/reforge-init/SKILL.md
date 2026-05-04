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

### Minimal Spec Shape

```json
{
  "meta": {
    "name": "New Reforge Spec",
    "version": "0.1.0",
    "lang": "en"
  },
  "entities": {},
  "flows": {},
  "views": {}
}
```

### Minimal Questions Shape

```json
{
  "pending": [],
  "answered": []
}
```

### Question Entry

- `id`: stable snake_case identifier.
- `phase`: one of `meta`, `data`, `view`, `flow`, `update`, `review`.
- `question`: localized user-facing question.
- `type`: one of `text`, `single_choice`, `multi_choice`, `multi_input`, `confirm`.
- `resolves`: array of spec paths, such as `entities.report.fields`.

Question priority order:

1. `meta`
2. `data`
3. `view`
4. `flow`
5. `update`
6. `review`

## Command Flow

1. Require a product description argument. If missing, ask for one product description and stop.
2. Read existing `SPEC_PATH` and `QUESTIONS_PATH` when present.
3. If `SPEC_PATH` already exists, do not overwrite it silently.
   - Ask one confirm question: overwrite existing spec or cancel.
   - If the user chooses overwrite and an existing spec is valid JSON, save it to `PREVIOUS_SPEC_PATH` before writing the new spec.
4. Start from the minimal spec shape.
5. Set `meta.name` from the most explicit product/app name in the description. If no name is explicit, use a neutral name and create a `meta` question for the final name.
6. Set `meta.version` to `"0.1.0"`.
7. Set `meta.lang` from existing valid spec language when available; otherwise default to `"en"`.
8. Extract only explicit entities, fields, views, and flows:
   - If an entity is explicitly named, add it.
   - If a field is explicitly named and its type is clear, add it.
   - If a field exists but type is unclear, create a question instead of guessing.
   - If a view or flow is not explicit, leave it absent and create the next needed question.
9. Generate pending questions for missing decisions needed to complete a useful MVP spec.
10. De-duplicate pending questions by normalized `resolves`.
11. Write `SPEC_PATH` and `QUESTIONS_PATH` only after the Quality Gate passes.
12. Present the highest-priority pending question if one exists; otherwise report that `/reforge:validate` can be run.

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
- Changed artifacts: `SPEC_PATH`, `QUESTIONS_PATH`, and optionally `PREVIOUS_SPEC_PATH`.
- Pending question count.
- Next gate:
  - If pending count is 0: `/reforge:validate`.
  - If pending count is greater than 0: answer the presented question or run `/reforge:resume`.
