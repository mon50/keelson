---
name: reforge-plan
description: Generate .reforge/tasks.json from approved .reforge/spec.json entities.
allowed-tools: Read, Write, Edit, Glob, AskUserQuestion
---

# reforge-plan

## Core Rule

- Think in English, respond to the user in the language specified by `meta.lang`.
- Treat `.reforge/spec.json` as the single source of truth for the product specification.
- Do not invent missing implementation tasks. Generate tasks only from explicit `entities` keys.
- Keep the skill self-contained. Do not require external prompt files.

## Canonical Paths

- `REFORGE_DIR = ".reforge"`
- `SPEC_PATH = ".reforge/spec.json"`
- `QUESTIONS_PATH = ".reforge/questions.json"`
- `TASKS_PATH = ".reforge/tasks.json"`

## Command Flow

1. Read `SPEC_PATH`.
   - If missing, block and report that `/reforge:init "<description>"` is required before planning.
   - If invalid JSON, block and report the file that must be fixed.
2. Check `meta.approved`.
   - If `meta.approved` is `false` or missing, refuse to execute and instruct the user to obtain approval via `/reforge:render` first.
   - Do not write `TASKS_PATH` while approval is missing.
3. Read `QUESTIONS_PATH` if present.
   - If `pending` has one or more entries, warn that unresolved questions remain before proceeding.
   - The warning is non-blocking after `meta.approved` is `true`.
4. Read `entities` from `SPEC_PATH`.
   - If `entities` is empty, block and report that tasks cannot be generated because no entity is defined.
   - Iterate every entity key in stable sorted order.
5. If `TASKS_PATH` already exists, ask one confirmation question before overwriting.
   - If the user cancels, do not mutate files.
6. Generate `.reforge/tasks.json`.
   - Each entity produces one task entry.
   - `id` is the entity key.
   - `entity` is the same entity key.
   - `status` is always `"pending"`.
   - `subtasks` is always `["db", "api", "ui", "test"]`.
7. Report generated entity names, subtask list, pending question count, changed artifacts, and next gate `/reforge:impl <entity>`.

## Approval Gate

`meta.approved: false` means the UI prototype has not been accepted. In that state, `reforge-plan` must refuse planning and must not write `.reforge/tasks.json`.

```text
Lifecycle: blocked
Reason: meta.approved is false
Next action: /reforge:render
```

## TasksJson Generation Example

Given this `entities` shape:

```json
{
  "report": {
    "fields": {
      "title": { "type": "string", "required": true }
    }
  },
  "user": {
    "fields": {
      "email": { "type": "string", "required": true }
    }
  }
}
```

Generate this `.reforge/tasks.json`:

```json
{
  "tasks": [
    {
      "id": "report",
      "entity": "report",
      "status": "pending",
      "subtasks": ["db", "api", "ui", "test"]
    },
    {
      "id": "user",
      "entity": "user",
      "status": "pending",
      "subtasks": ["db", "api", "ui", "test"]
    }
  ]
}
```

## Completion Report

Report concisely:

- Lifecycle stage: `planned` or `blocked`.
- Changed artifacts: `TASKS_PATH`, or `none`.
- Generated tasks: entity names and `["db", "api", "ui", "test"]`.
- Pending question count from `QUESTIONS_PATH`.
- Next gate:
  - If tasks were generated: `/reforge:impl <first-entity>`.
  - If blocked: the exact next action from the blocking branch.
