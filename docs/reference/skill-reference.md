# Reforge Skill Reference

> 📖 **日本語リファレンスはこちら:** [スキルリファレンス (日本語)](ja/skill-reference.md)

Complete reference for all Reforge skills and the `.reforge/` workspace schema.

## Skill Index

| Skill | Phase | Description |
|---|---|---|
| [`reforge-init`](#reforge-init) | Spec | Initialize `spec.json` and the question queue |
| [`reforge-resume`](#reforge-resume) | All phases¹ | **Navigator mode** — routes to the right next action at any phase |
| [`reforge-answer`](#reforge-answer) | Spec³ | **Manual mode** — Q&A only; answer pending questions without phase routing |
| [`reforge-update`](#reforge-update) | Any phase² | Apply a natural-language change to the spec |
| [`reforge-diff`](#reforge-diff) | Any phase² | Show JSON-path changes since last snapshot |
| [`reforge-validate`](#reforge-validate) | Spec | Check spec completeness and consistency |
| [`reforge-render`](#reforge-render) | Prototype | Start the local prototype server |
| [`reforge-plan`](#reforge-plan) | Plan | Generate `tasks.json` from the approved spec |
| [`reforge-impl`](#reforge-impl) | Implement | Implement one entity end-to-end |
| [`reforge-verify`](#reforge-verify) | Verify | Check implementation against the spec |

¹ **All phases** — `reforge-resume` actively navigates every phase gate, from first question to final verify.  
² **Any phase** — optional utilities you can invoke at any point without affecting the main lifecycle flow.  
³ **Manual mode** — Use `reforge-answer` instead of `reforge-resume` when you want to control phase transitions yourself. It only handles Q&A and never recommends the next command.

### Navigator vs Manual Mode

| | Navigator mode | Manual mode |
|---|---|---|
| Q&A | `/reforge-resume` (handles questions automatically) | `/reforge-answer` |
| Phase progression | `/reforge-resume` (routes to next phase) | Run each phase command directly: `/reforge-validate`, `/reforge-render`, `/reforge-plan`, `/reforge-impl`, `/reforge-verify` |
| Output | Phase map + current phase + NextAction | Minimal: lifecycle stage + remaining pending count |

Pick one mode and stay in it. Mixing them works but defeats the design intent of each.

---

## Spec Skills

### `reforge-init`

Initialize a Reforge workspace from a natural-language product description.

**Argument:** `"<product description>"` (required)

**Reads:** nothing (first run); if a spec with the same derived name already exists, reads it before deciding whether to overwrite

**Writes:**
- `.reforge/specs/<name>/spec.json` — scaffolded product spec
- `.reforge/specs/<name>/questions.json` — initial question queue

The spec name is auto-derived from the description as a kebab-case slug (e.g., `"Photo Albums"` → `photo-albums`).

**Behavior:**
- Populates `meta`, optional `requirements`, optional `context`, `tech`, `entities`, `views`, and `flows` from what can be inferred
- Uses Inception-first ordering: `audience`, `intent`, and `requirements` before construction details
- Records brownfield context for existing-repository feature work when explicit or safely detectable
- Converts every unanswered product decision into a pending question
- Presents a question batch or writes `questions.md` at the end and stops
- Never invents enum options, field names, roles, or approval rules without evidence

**Outcome codes:** `files_written`, `questions_batch`, `questions_md`, `blocked`, `complete`

**Example:**
```
/reforge-init "A field-team daily report app with supervisor approval"
```

---

### `reforge-resume`

Lifecycle navigator. Evaluates the full workspace state and routes to the correct next action for whatever phase you are in.

**Argument:** `[<spec-name>]` (optional — omit when only one spec exists)

**Reads:** `.reforge/specs/<name>/spec.json`, `.reforge/specs/<name>/questions.json`, `.reforge/specs/<name>/tasks.json`

**Writes:** `.reforge/specs/<name>/spec.json`, `.reforge/specs/<name>/questions.json` — only when recording an answer to a pending question

**Decision tree (evaluated top-to-bottom; stops at first match):**

| Condition | Output |
|---|---|
| `spec.json` missing or invalid | Block; guide to `/reforge-init` |
| Pending questions exist | Present up to 4 questions or write `questions.md`; record answers on reply |
| Validation errors found | Block; guide to `/reforge-validate` |
| `meta.approved` is false | Block; guide to `/reforge-render` |
| `tasks.json` missing | Block; guide to `/reforge-plan` |
| Pending or in-progress task exists | Guide to `/reforge-impl <entity>` for the first pending task |
| All tasks done, no verify evidence | Guide to `/reforge-verify` |
| All tasks done, verify complete | Report project complete |

**When answering a question:**
- Applies the answer only to the `resolves` paths listed in the question entry
- Moves the question from `pending` to `answered`
- Stops after the current Q&A action - run `/reforge-resume` again to continue

**When to use:** Any time you are unsure what to do next, or want to resume after an interruption. Safe to run at any phase — it never mutates state unless recording a question answer.

---

### `reforge-answer`

Manual-mode Q&A. Present pending questions and record answers. Does NOT route phases or recommend the next command.

**Argument:** `[<spec-name>]` (optional — omit when only one spec exists)

**Reads:** `.reforge/specs/<name>/spec.json`, `.reforge/specs/<name>/questions.json`

**Writes:** `.reforge/specs/<name>/spec.json`, `.reforge/specs/<name>/questions.json` — only when recording an answer

**Behavior:**
- If pending questions exist, present up to 4 or write `questions.md`; on reply, write answers to the `resolves` paths and move answered items to `answered`.
- If no `pending` questions remain, return `complete` and stop. The user decides which phase command to run next.
- Output is minimal: lifecycle stage and remaining pending count. No phase map, no NextAction, no command recommendation.

**Outcome codes:** `answered`, `complete`, `blocked`

**When to use:** When you prefer **manual mode** — you want to drive each phase yourself by invoking `/reforge-validate`, `/reforge-render`, `/reforge-plan`, `/reforge-impl`, `/reforge-verify` directly. `/reforge-answer` is the manual-mode replacement for `/reforge-resume`'s Q&A capability.

**Don't use this if:** You want automatic phase progression. Use `/reforge-resume` (navigator mode) instead.

**Example:**
```
/reforge-answer
```

---

### `reforge-update`

Apply a natural-language change request to `spec.json`.

**Arguments:** `[<spec-name>]` (optional), `"<change request>"` (required)

**Reads:** `.reforge/specs/<name>/spec.json`, `.reforge/specs/<name>/questions.json`

**Writes:**
- `.reforge/specs/<name>/spec.json` — targeted update
- `.reforge/specs/<name>/spec.previous.json` — snapshot of the spec before the change
- `.reforge/specs/<name>/questions.json` — may add new pending questions if the change introduces ambiguity
- `.reforge/specs/<name>/tasks.previous.json` — when `meta.approved` flips from `true` to `false` (or entities change), the existing `tasks.json` is moved here so `/reforge-resume` can detect that a re-plan is required

**Behavior:**
- Modifies only the paths affected by the change request
- Preserves all unaffected fields and sections
- Preserves optional `requirements` and `context` unless explicitly changed
- Sets `meta.approved = false` if the spec was previously approved
- Retires `tasks.json` to `tasks.previous.json` when approval is reset, forcing a re-plan after the next approval
- Converts ambiguous aspects of the request into pending questions rather than guessing
- Next gate is always `/reforge-resume`, which routes through inline validation, re-approval (`/reforge-render`), and re-plan (`/reforge-plan`) automatically

**Example:**
```
/reforge-update "Add a PDF export option to the monthly summary view"
```

---

### `reforge-diff`

Show what changed between the previous spec snapshot and the current spec.

**Argument:** `[<spec-name>]` (optional — omit when only one spec exists)

**Reads:** `.reforge/specs/<name>/spec.json`, `.reforge/specs/<name>/spec.previous.json`

**Writes:** nothing

**Output:** JSON-path diff listing added, changed, and removed paths, plus the count of unresolved pending questions.

**When to use:** After `reforge-update`, before continuing to the next phase.

---

### `reforge-validate`

Validate `spec.json` for completeness and internal consistency.

**Argument:** `[<spec-name>]` (optional — omit when only one spec exists)

**Reads:** `.reforge/specs/<name>/spec.json`, `.reforge/specs/<name>/questions.json` (optional)

**Writes:** nothing

**Checks:**
- All required `meta` and `tech` fields are present
- Every `views` entry references an entity that exists in `entities`
- Every `flows` entry has at least one step
- Enum fields have `options` defined
- No `required` flag set on fields whose values are not yet provided

**Outcome:** Reports all issues in a single pass (does not stop at the first error). Clean validation is a prerequisite for `reforge-plan`.

---

## Prototype Skills

### `reforge-render`

Start a local HTML prototype server for human review and approval.

**Argument:** `[<spec-name>]` (optional — omit when only one spec exists)

**Reads:** `.reforge/specs/<name>/spec.json`

**Writes:** `spec.json` → `meta.approved = true` when you click **Approve** in the browser

The prototype shows each entity as a form or list view. The **Approve** button appears at the bottom of the page.

**Behavior:**
- Starts the renderer server at `node .reforge/server/index.js`
- Prints the local URL and keeps the process running
- The prototype reflects the current `entities`, `views`, and `flows` in `spec.json`
- Approval in the browser is the gate that unlocks `reforge-plan`

**Prerequisites:** `spec.json` must exist and be valid. Run `reforge-validate` first if unsure.

---

## Plan Skills

### `reforge-plan`

Generate the implementation task queue from the approved spec.

**Argument:** `[<spec-name>]` (optional — omit when only one spec exists)

**Reads:** `.reforge/specs/<name>/spec.json`

**Writes:** `.reforge/specs/<name>/tasks.json`

**Blocked when:** `meta.approved` is `false` or missing — run `reforge-render` to approve first.

**Output format:**

```json
{
  "tasks": [
    {
      "id": "task-1",
      "entity": "EntityName",
      "status": "pending",
      "subtasks": ["db", "api", "ui", "test"]
    }
  ]
}
```

One task entry is created per entity in `spec.json`. The `subtasks` array is always `["db", "api", "ui", "test"]`.

---

## Implementation Skills

### `reforge-impl`

Implement one entity from the approved spec end-to-end.

**Arguments:** `[<spec-name>]` (optional), `[<entity>]` (optional — defaults to the first `pending` task in `tasks.json`)

**Reads:** `.reforge/specs/<name>/spec.json`, `.reforge/specs/<name>/tasks.json`

**Writes:** Implementation files (schema, routes, components, tests) + updates task `status` to `done`

**Blocked when:**
- `spec.json` is missing → run `reforge-init`
- `meta.approved` is not `true` → run `reforge-render`
- `tasks.json` is missing → run `reforge-plan`

**Behavior:**
- Selects the target entity (from argument or first pending task)
- Generates all four subtask layers in one pass: `db`, `api`, `ui`, `test`
- Marks the task `done` after completion
- Reports exactly what files were created or modified

**Subtask layers:**

| Subtask | What is generated |
|---|---|
| `db` | Database migration or schema file |
| `api` | Route handlers and service-layer functions |
| `ui` | Page and form components |
| `test` | Unit and integration test files |

**Run in a loop** until all tasks are `done`.

---

## Verification Skills

### `reforge-verify`

Verify that the implementation matches the approved spec. Read-only.

**Argument:** `[<spec-name>]` (optional — omit when only one spec exists)

**Reads:** `.reforge/specs/<name>/spec.json`, `.reforge/specs/<name>/tasks.json`, implementation files

**Writes:** nothing

**Checks:**
- Every entity in `spec.json` has at least one corresponding implementation file
- Every field declared in `entities` is covered in the generated code
- Every task in `tasks.json` has `status: "done"`
- Brownfield context is reported when present; acceptance criteria that cannot be proven structurally remain manual checks

**Output:** Per-entity pass/fail report. Does not block on `meta.approved` — can be run at any point for informational purposes.

---

## Workspace Schema

Each spec lives under `.reforge/specs/<name>/`. The `<name>` is a kebab-case slug auto-derived from `meta.name` at init time (e.g., `"Photo Albums"` → `photo-albums`).

### `.reforge/specs/<name>/spec.json`

The single source of truth for the product specification. All Reforge skills read this file before acting.

```jsonc
{
  "meta": {
    "name": "string",       // product name
    "version": "string",    // spec version
    "lang": "string",       // response language (e.g. "ja", "en")
    "approved": false,      // set to true by reforge-render on human approval
    "audience": [],         // optional Inception target users
    "intent": ""            // optional Inception product intent
  },
  "requirements": [],
  "context": {
    "mode": "greenfield | brownfield | unknown",
    "repository": {
      "existing": true,
      "detectedStack": ["string"],
      "conventions": ["string"]
    },
    "changeScope": {
      "feature": "string",
      "affectedAreas": ["string"],
      "allowedWriteAreas": ["string"],
      "protectedAreas": ["string"]
    },
    "acceptanceCriteria": ["string"],
    "risks": ["string"]
  },
  "tech": {
    "frontend": "string",   // e.g. "Next.js"
    "backend": "string",    // e.g. "Node.js / Express"
    "database": "string",   // e.g. "PostgreSQL"
    "orm": "string",        // e.g. "Prisma"
    "styling": "string",    // e.g. "Tailwind CSS"
    "testing": "string"     // e.g. "Vitest"
  },
  "entities": {
    "EntityName": {
      "fields": {
        "fieldName": {
          "type": "string | number | date | enum | text | boolean",
          "required": true,
          "options": ["a", "b"]  // required when type is "enum"
        }
      }
    }
  },
  "views": {
    "ViewName": {
      "type": "string",       // e.g. "list", "form", "detail"
      "entity": "EntityName", // must reference an entity in entities
      "fields": ["fieldName"] // optional subset of entity fields
    }
  },
  "flows": {
    "FlowName": {
      "steps": ["step 1", "step 2"]
    }
  }
}
```

### `.reforge/specs/<name>/questions.json`

The question queue shared across all spec skills.

```jsonc
{
  "pending": [
    {
      "id": "q-1",
      "phase": "meta | audience | intent | requirements | tech | data | views | flows | update",
      "question": "What authentication method should the app use?",
      "type": "string",
      "resolves": ["tech.auth"]  // JSON paths that the answer fills in
    }
  ],
  "answered": [
    {
      "id": "q-0",
      "phase": "meta",
      "question": "What is the name of this product?",
      "type": "string",
      "resolves": ["meta.name"],
      "answer": "DailyReport"
    }
  ]
}
```

### `.reforge/specs/<name>/questions.md`

Optional Markdown question batch written when there are 5 or more pending questions. Users can fill in `Answer:` lines and rerun `/reforge-resume` or `/reforge-answer`.

### `.reforge/specs/<name>/tasks.json`

The implementation task queue written by `reforge-plan` and consumed by `reforge-impl`.

```jsonc
{
  "tasks": [
    {
      "id": "task-1",
      "entity": "EntityName",
      "status": "pending | in_progress | done",
      "subtasks": ["db", "api", "ui", "test"]
    }
  ]
}
```

### `.reforge/specs/<name>/spec.previous.json`

A snapshot of `spec.json` taken before the most recent `reforge-update`. Used by `reforge-diff`. Never written by any skill other than `reforge-update` and `reforge-init`.

> **First run:** This file does not exist on a fresh workspace. `/reforge-diff` reports "no previous snapshot found" until the first `reforge-update` (or `reforge-init` overwrite) creates it.

### `.reforge/specs/<name>/tasks.previous.json`

The previous `tasks.json`, retired when `reforge-update` resets `meta.approved` to `false` (or modifies `entities`). Created by renaming `tasks.json` so that `/reforge-resume` detects the missing task queue and routes to `/reforge-plan` after re-approval. Safe to delete once a fresh `tasks.json` has been generated.

> **Note:** Only `reforge-update` writes this file. `reforge-plan` does not consult it.

---

## Constraints Shared by All Skills

- **No guessing.** Skills never invent field names, enum values, roles, approval rules, or tech choices without evidence from the description or a prior answer.
- **One question tool call per run.** Skills may present up to 4 questions in one batch, or write `questions.md` for larger batches.
- **Schema compliance.** Every write preserves the `meta`, optional `requirements`, optional `context`, `tech`, `entities`, `views`, `flows` structure in `spec.json` and the `pending`, `answered` structure in `questions.json`.
- **Language consistency.** Explanations and questions follow `meta.lang`. File paths, JSON keys, status markers, and skill names are always literal.
- **Standard paths.** The `.reforge/` paths listed above must not be renamed or moved.
