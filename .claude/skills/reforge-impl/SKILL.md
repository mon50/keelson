---
name: reforge-impl
description: Implement one entity end-to-end (DB, API, UI, tests) based on the spec, with explicit preflight and postflight reports.
disable-model-invocation: true
allowed-tools: Read Bash Write Edit AskUserQuestion Glob
argument-hint: "[entity]"
---

# Reforge Impl

## Inputs
- Optional spec name and entity: $ARGUMENTS

## Preconditions
- Target spec can be resolved deterministically
- `meta.approved` is `true`
- `tasks.json` exists

## Read set
- .reforge/specs/<name>/spec.json
- .reforge/specs/<name>/tasks.json

## Write set
- .reforge/specs/<name>/tasks.json
- Project source files related to the entity (DB migrations, API routes, UI components, tests)

## Procedure
1. Resolve target spec.
2. Read `spec.json` and `tasks.json`.
3. If spec is not approved or `tasks.json` does not exist, report failure.
4. Deterministic entity selection:
   - If `[entity]` is provided, find its task in `tasks.json`.
   - If not provided, pick the first task with status `in_progress`. If none, pick the first with status `pending`.
   - If no tasks are pending or in_progress, return an explanatory response: "All tasks are complete. Next recommended command: reforge-verify". Stop.
5. Provide **Preflight Report**:
   - Target spec name
   - Target entity
   - Intended subtasks (from the task object)
   - Expected file categories to be created/modified (e.g. Database schema, API endpoints, UI components, Tests).
   - *Wait for user confirmation if necessary, or just proceed if you are confident (but you must output the preflight report first).*
6. Set task status to `in_progress` in `tasks.json`.
7. Implement the subtasks based ONLY on `spec.json`:
   - DB: migrations
   - API: CRUD endpoints
   - UI: components
   - Tests: unit/integration
   - Keep track of exactly which files you create or modify.
8. If implementation fails at any point:
   - Revert task status back to `pending`.
   - Report the error and the consistent task state transition. Stop.
9. If implementation succeeds:
   - Run tests or build checks if appropriate.
   - Set task status to `done` in `tasks.json`.
10. Provide **Postflight Report**:
   - Accurately enumerate all changed files.
   - Confirm task status transition to `done`.
   - Recommend next command (e.g. `reforge-impl` for next entity, or `reforge-verify` if all done).

## Additional resources
- reference.md
- examples.md
