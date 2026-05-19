---
name: keel-impl
description: Implement one approved plan task using a Kiro-style loop: task selection, test-first intent, implementation, verification, and implementation notes.
allowed-tools: Read, Write, Edit, Bash, AskUserQuestion
argument-hint: [task-id]
---

# keel-impl

## Purpose

Implement one task from `plan.md` using the approved Keelson artifact bundle as source of truth.

## Inputs

- `requirements.md`
- `user-stories.md`
- `us-mock.html`
- `design.md`
- `prototype.html`
- `plan.md`
- `manifest.json`
- `audit.md` if present; create it if missing.
- `.keelson/steering/*.md` if present — honor the project's product, tech, and principles.

Block unless `artifacts.plan.status` is `approved`.

Read `audit.md` first to recover prior decisions and the current `## Resume Point`.

## Task Selection

If `[task-id]` is provided, implement that task. Otherwise choose the first unchecked or pending task in `plan.md`.

Do not ask new product questions during implementation. If a task cannot be implemented from the approved artifacts, stop and route to the phase that owns the gap:

- missing requirement: `/keel-requirements`
- missing user operation: `/keel-us`
- missing implementation detail: `/keel-design`
- prototype/design mismatch: `/keel-proto`

## Kiro Implementation Loop

For each task:

1. Restate the task, source artifacts, and files expected to change.
2. Inspect the relevant existing code before editing.
3. Add or update tests first when the repository has a matching test pattern.
4. Implement the smallest change that satisfies the task.
5. Run the relevant tests or checks.
6. Update `plan.md` with task status and implementation notes.
7. Append an implementation entry to `audit.md` with task id, files changed, checks run, and remaining work.
8. Update `## Resume Point` in `audit.md` to the next pending task or the owning phase if blocked.
9. Report files changed, checks run, and any remaining manual verification.

## Boundaries

Before editing any file, check it against the boundaries in `design.md`:

- The file must fall within `## Files To Touch`. A file outside that list is an out-of-scope edit.
- The file must not appear in `## Files Not To Touch`.

If the task genuinely needs a file outside `Files To Touch`, or one inside `Files Not To Touch`:

1. Stop. Do not make the edit.
2. Report which file is out of bounds and why the task needs it.
3. Route back to `/keel-design` to widen `Files To Touch` deliberately, then re-plan with `/keel-plan`.

Never widen scope silently. Keep the prototype as visual evidence, not implementation source code.

## Quality Gate

- The implemented task traces to requirements, user stories, design, and plan.
- Tests/checks cover the task or the report explicitly states why manual verification remains.
- `plan.md` records what changed and what remains.
- `audit.md` records the implementation outcome and next resume point.
- When every task in `plan.md` is done, recommend `/keel-verify` to audit the feature against the approved artifacts.
