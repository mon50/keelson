---
name: reforge-diff
description: Show JSON-path differences between .reforge/spec.previous.json and .reforge/spec.json, plus unresolved question count.
allowed-tools: Read, Glob
---

# reforge-diff

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
   - If missing, block and report that no current spec exists.
   - If invalid JSON, block and report the file that must be fixed.
2. Determine response language from current spec `meta.lang`.
3. Read `PREVIOUS_SPEC_PATH`.
   - If missing, block and report that no previous snapshot exists. Suggest running `/reforge:update "<change>"` after a spec exists.
   - If invalid JSON, block and report the file that must be fixed.
4. Read `QUESTIONS_PATH` if present.
   - If missing or invalid, use pending count `0` but report that question state was unavailable when relevant.
5. Recursively compare previous and current specs by JSON path.
6. Classify each difference:
   - `added`: path absent before and present now.
   - `removed`: path present before and absent now.
   - `changed`: path present in both but value differs.
7. If no differences exist, report `No changes`.
8. Always include pending question count.

## Diff Rules

- Use dot paths for object keys: `entities.report.fields.content`.
- Use bracket indexes for arrays: `flows.approval.steps[0]`.
- Sort output by path for stable review.
- Keep long values summarized:
  - Prefer path and change kind over full JSON dumps.
  - Show small scalar before/after values when useful.
- Do not mutate files.

## Output Format

Use this shape, localized except for markers and paths:

```text
Lifecycle: diff
Pending questions: <N>
+ <path>
- <path>
~ <path>: <before> -> <after>
Next gate: /reforge:validate if pending is 0, otherwise /reforge:resume
```

If no changes:

```text
Lifecycle: diff
Pending questions: <N>
No changes
Next gate: /reforge:validate if pending is 0, otherwise /reforge:resume
```

If blocked:

```text
Lifecycle: diff
Blocked: <reason>
Next action: <action>
```
