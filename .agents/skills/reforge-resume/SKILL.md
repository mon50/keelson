---
name: reforge-resume
description: Resume a Reforge specification session from .reforge/questions.json and present exactly one pending question.
allowed-tools: Read, Write, Edit, Glob, AskUserQuestion
---

# reforge-resume

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

## Command Flow

1. Read `SPEC_PATH`.
   - If missing, block and report that `/reforge:init "<description>"` is required.
   - If invalid JSON, block and report the file that must be fixed.
2. Read `QUESTIONS_PATH`.
   - If missing, block and report that the session cannot resume without question state.
   - If invalid JSON, block and report the file that must be fixed.
3. Validate that questions root has `pending` and `answered` arrays.
4. Sort or select pending by dependency priority without reordering unless needed:
   - `meta`, `data`, `view`, `flow`, `update`, `review`.
5. If `pending` is empty:
   - Report lifecycle stage `complete`.
   - Report pending count `0`.
   - Tell the user to run `/reforge:validate`.
6. If `pending` has entries:
   - Present exactly the first/highest-priority question.
   - Do not present additional questions in the same response.

## Answer Application

If this resume run includes a user answer to a previously presented question:

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

## Core Compliance Rules

- Never create a field with an unknown type.
- Never create `enum` without one or more explicit options.
- Never remove unrelated spec paths while applying an answer.
- Never infer additional fields from examples unless the user explicitly confirms them.

## Completion Report

Report concisely:

- Lifecycle stage: `resumed`, `answered`, or `complete`.
- Changed artifacts: `SPEC_PATH` and/or `QUESTIONS_PATH`, or `none`.
- Pending question count.
- Next gate:
  - If pending count is 0: `/reforge:validate`.
  - If pending count is greater than 0: answer the single presented question or run `/reforge:resume`.

