# Reforge Workflow Guide

> 📖 **日本語ガイドはこちら:** [ワークフローガイド (日本語)](ja/workflow-guide.md)

This guide walks through the full Reforge lifecycle: from an initial product idea to a verified implementation. Each phase is gated by human review — Reforge never makes product decisions on your behalf.

## Overview

Reforge supports two usage modes. **The lifecycle is identical** — the only difference is whether Reforge decides the next action for you or you decide yourself.

### Navigator mode (recommended; best for first-time users)

After `reforge-init`, drive the entire lifecycle with a single command:

```
reforge-init "description"   # once
reforge-resume               # repeat until complete
```

`reforge-resume` is the lifecycle navigator. Each run reads the workspace state, prints a phase map + current phase + NextAction, and handles both question Q&A and phase routing automatically.

### Manual mode (when you want to control phase progression yourself)

Run each phase command in sequence:

```
Phase 1 — Spec      reforge-init → answer questions via reforge-answer → reforge-validate
Phase 2 — Prototype reforge-render → human approval
Phase 3 — Plan      reforge-plan
Phase 4 — Implement reforge-impl (one entity per run)
Phase 5 — Verify    reforge-verify
```

`reforge-answer` is the **Q&A-only skill** for manual mode. It presents one pending question and records one answer — no phase map, no NextAction, no command recommendation. By design, manual mode does not use `reforge-resume`.

### Picking a mode

| | Navigator mode | Manual mode |
|---|---|---|
| Q&A | `reforge-resume` | `reforge-answer` |
| Phase progression | `reforge-resume` (automatic) | Run each phase command directly |
| Output | Phase map + NextAction | Minimal (remaining question count) |
| Best for | First-time users / running straight through | Stopping at each phase / users who already know each command's role |

Optional at any time: `reforge-update` to revise the spec, `reforge-diff` to review changes.

---

## Key Terms

| Term | Meaning |
|---|---|
| **Entity** | A core data object the app tracks — e.g., `DailyReport`, `User`. Each entity maps to a database table and an API resource. |
| **View** | A UI screen that displays or edits an entity — e.g., a list view, a form, a detail page. |
| **Flow** | A multi-step user journey that crosses one or more views — e.g., "Submit report → Supervisor review → Approve". |
| **Spec** | The `spec.json` file: the single source of truth for all product decisions about one feature or initiative. |
| **Agent Skill** | A plain-text instruction file installed by `npx aid-reforge install` that teaches the AI agent how to execute one lifecycle command. |

---

## Phase 1 — Spec

### Step 1: Initialize

```
/reforge-init "A daily-report app for field teams"
```

`reforge-init` reads your description and produces:

- `.reforge/specs/daily-report/spec.json` — the product spec with `meta`, `tech`, `entities`, `views`, and `flows` sections
- `.reforge/specs/daily-report/questions.json` — a queue of pending questions about details that could not be inferred

The spec name (`daily-report`) is auto-derived from your description as a kebab-case slug. It then presents the single highest-priority pending question and stops.

**Expect 8–15 questions for a typical spec.** The first 6 are always tech-stack questions (`frontend`, `backend`, `database`, `orm`, `styling`, `testing`) unless you mention them in the description. After that come entity, view, and flow questions.

**Example output:**

```
Created: .reforge/specs/daily-report/spec.json
Created: .reforge/specs/daily-report/questions.json

Pending question (1 of 11):
  What frontend framework should the app use?
  (e.g., Next.js, Vite + React, Nuxt)
```

### Step 2: Answer questions (and navigate the full lifecycle)

```
/reforge-resume
```

`reforge-resume` is a lifecycle navigator. On every run it reads the current workspace state and routes to the right action — not just questions, but every phase gate.

The decision tree it evaluates in order:

| State | Action |
|---|---|
| `spec.json` missing | Guide to `/reforge-init` |
| Pending questions exist | Present the top-priority question, record your answer |
| Validation errors found | Guide to `/reforge-validate` |
| `meta.approved` is false | Guide to `/reforge-render` |
| `tasks.json` missing | Guide to `/reforge-plan` |
| Pending or in-progress task | Guide to `/reforge-impl <entity>` |
| All tasks done, verify pending | Guide to `/reforge-verify` |
| All done | Report project complete |

**One action per run.** Each invocation presents or records exactly one thing (one question, one next-step instruction) and then stops. After you answer a question, run `/reforge-resume` again to get the next one — this is manual re-invocation by design, so you stay in control of the pace.

**Pausing at the prototype step.** When the navigator reaches the `reforge-render` phase, it instructs you to run `/reforge-render` and open the browser URL. The lifecycle is paused there until you click **Approve** in the browser. Once approved, run `/reforge-resume` again and the navigator will proceed to the next phase.

**When to stop answering:** When `reforge-resume` reports `complete: no pending questions` and guides you to `/reforge-validate`, proceed to Step 3. In navigator mode, `reforge-resume` will guide you there automatically — you do not need to run `/reforge-validate` yourself.

> **Tip:** If you lose track of where you are in the workflow, `/reforge-resume` always tells you the next step.

### Step 3: Validate

> In navigator mode, `/reforge-resume` guides you here automatically after all questions are answered. In manual mode, run this command yourself.

```
/reforge-validate
```

`reforge-validate` checks `spec.json` for:

- Missing required fields
- Enum values that do not match `options`
- Views referencing entities that do not exist
- Flows with no steps

If issues are found, the skill reports all of them in a single pass. Fix the spec (via `reforge-update`) and re-run until clean. In navigator mode, a clean validation result causes the next `/reforge-resume` run to automatically advance to the prototype phase.

### Optional: Update and diff

```
/reforge-update "Add an export-to-CSV feature for monthly reports"
/reforge-diff
```

Use `reforge-update` to apply natural-language changes at any time. It preserves all unaffected spec paths. Use `reforge-diff` to review the JSON-path changes between the previous and current snapshot before continuing.

> **Note:** `spec.previous.json` is created on the first `reforge-update` (or `reforge-init` overwrite). Before that, `/reforge-diff` reports "no previous snapshot found."

---

## Phase 2 — Prototype

### Step 4: Review the UI prototype

> In navigator mode, `/reforge-resume` guides you here automatically after validation passes. The lifecycle pauses at this step until you approve in the browser.

```
/reforge-render
```

`reforge-render` starts a local web server that renders a prototype from `spec.json`. Open the URL it prints, walk through the prototype, and approve or reject.

The prototype shows each entity as a form or list view based on the `views` in `spec.json`. At the bottom of the page is an **Approve** button. Clicking it writes `meta.approved = true` to `spec.json` and unlocks `reforge-plan`. After approving, run `/reforge-resume` to continue.

**If you reject:** Update the spec with `reforge-update`, re-validate, and re-render.

---

## Phase 3 — Plan

### Step 5: Generate the task queue

> In navigator mode, `/reforge-resume` guides you here automatically after prototype approval.

```
/reforge-plan
```

`reforge-plan` reads the approved `spec.json` and writes `.reforge/specs/<name>/tasks.json`. Each entry in the task queue maps to one entity and lists the subtasks required: `db`, `api`, `ui`, and `test`.

This step is blocked if `meta.approved` is not `true`.

**Example `tasks.json`:**

```json
{
  "tasks": [
    { "id": "task-1", "entity": "DailyReport", "status": "pending", "subtasks": ["db", "api", "ui", "test"] },
    { "id": "task-2", "entity": "User",        "status": "pending", "subtasks": ["db", "api", "ui", "test"] }
  ]
}
```

---

## Phase 4 — Implement

### Step 6: Implement entity by entity

> In navigator mode, `/reforge-resume` guides you here automatically after the task queue is generated.

```
/reforge-impl
```

Without an argument, `reforge-impl` picks the first `pending` task from `tasks.json` and implements it end-to-end: database schema, API layer, UI components, and tests. When done, it marks the task `done` and reports what was generated.

To implement a specific entity:

```
/reforge-impl DailyReport
```

Run `/reforge-impl` in a loop until all tasks are `done`.

**What `reforge-impl` produces per entity (example with Next.js + Prisma):**

| Subtask | What is generated |
|---|---|
| `db` | `prisma/migrations/<timestamp>_daily_report.sql` |
| `api` | `src/app/api/daily-reports/route.ts` |
| `ui` | `src/app/daily-reports/page.tsx`, `src/components/DailyReportForm.tsx` |
| `test` | `src/app/api/daily-reports/route.test.ts`, `src/components/DailyReportForm.test.tsx` |

Actual paths follow the tech stack you specified in the spec.

---

## Phase 5 — Verify

### Step 7: Verify implementation

> In navigator mode, `/reforge-resume` guides you here automatically after all tasks are done.

```
/reforge-verify
```

`reforge-verify` is read-only. It checks:

- All entities in `spec.json` have corresponding implementation files
- All tasks in `tasks.json` are marked `done`
- Generated files cover the fields declared in the spec

It produces a per-entity pass/fail report. For any failing entity, open the reported implementation files and fix the flagged issues manually. Re-run `/reforge-verify` until all entities pass.

---

## Common Patterns

### Resume after interruption

Because all state lives in `.reforge/`, you can always pick up where you left off:

- In the spec phase: run `/reforge-resume` — it reads the current question queue.
- In the implementation phase: run `/reforge-impl` — it reads `tasks.json` and skips `done` tasks.

### Revise the spec after approval

If you need to change the spec after `meta.approved = true`, run `/reforge-update` once and then drive the rest of the recovery with `/reforge-resume` — the navigator routes you through re-approval and re-plan automatically.

1. Run `/reforge-update "your change"` — `meta.approved` is reset to `false` automatically, and any existing `tasks.json` is moved to `tasks.previous.json` so the navigator knows a re-plan is required.
2. Run `/reforge-resume` — it will land on the `Approve` phase. Run `/reforge-render` and re-approve the updated prototype.
3. Run `/reforge-resume` again — it will land on the `Plan` phase. Run `/reforge-plan` to regenerate `tasks.json`.
4. Continue with `/reforge-impl` and `/reforge-verify` as guided by subsequent `/reforge-resume` runs.

> **Note:** `/reforge-validate` runs inline inside `/reforge-resume`, so you do not need to invoke it manually. The next-gate of `/reforge-update` always points to `/reforge-resume`.

### Multiple specs in one project

Run `reforge-init` for each feature or initiative. Each gets its own directory:

```
/reforge-init "Daily report app"      # → .reforge/specs/daily-report/
/reforge-init "Admin dashboard"       # → .reforge/specs/admin-dashboard/
```

Specify the spec name when running other commands:

```
/reforge-resume daily-report          # navigate daily-report
/reforge-impl admin-dashboard User    # implement User in admin-dashboard
```

When only one spec exists, the name argument can be omitted.

### Version control

Committing `.reforge/` lets teammates share spec progress. If you prefer to keep workspace state local, add `.reforge/` to `.gitignore`.

---

## Next Steps

- [Skill Reference](../reference/skill-reference.md) — per-skill inputs, outputs, and constraints
