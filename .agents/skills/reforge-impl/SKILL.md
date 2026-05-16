---
name: reforge-impl
description: Implement one approved plan task using a cc-sdd-style loop: task selection, test-first intent, implementation, verification, and implementation notes.
allowed-tools: Read, Write, Edit, Bash, AskUserQuestion
argument-hint: [task-id]
---

# reforge-impl

## Purpose

Implement one task from `plan.md` using the approved Reforge artifact bundle as source of truth.

## Inputs

- `requirements.md`
- `user-stories.md`
- `us-mock.html`
- `design.md`
- `prototype.html`
- `plan.md`
- `manifest.json`

Block unless `artifacts.plan.status` is `approved`.

## Task Selection

If `[task-id]` is provided, implement that task. Otherwise choose the first unchecked or pending task in `plan.md`.

Do not ask new product questions during implementation. If a task cannot be implemented from the approved artifacts, stop and route to the phase that owns the gap:

- missing requirement: `/reforge-requirements`
- missing user operation: `/reforge-us`
- missing implementation detail: `/reforge-design`
- prototype/design mismatch: `/reforge-proto`

## cc-sdd Implementation Loop

For each task:

1. Restate the task, source artifacts, and files expected to change.
2. Inspect the relevant existing code before editing.
3. Add or update tests first when the repository has a matching test pattern.
4. Implement the smallest change that satisfies the task.
5. Run the relevant tests or checks.
6. Update `plan.md` with task status and implementation notes.
7. Report files changed, checks run, and any remaining manual verification.

## Boundaries

- Follow `design.md` file boundaries.
- Respect `Files Not To Touch`.
- Keep prototype as visual evidence, not implementation source code.
- Do not widen scope without returning to an earlier phase.

## Quality Gate

- The implemented task traces to requirements, user stories, design, and plan.
- Tests/checks cover the task or the report explicitly states why manual verification remains.
- `plan.md` records what changed and what remains.
