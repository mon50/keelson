---
name: reforge-plan
description: Generate or update tasks.json deterministically from spec.json entities.
disable-model-invocation: true
allowed-tools: Read Write
---

# Reforge Plan

## Inputs
- Optional spec name: $ARGUMENTS

## Preconditions
- Repository is open
- Target spec can be resolved deterministically

## Read set
- .reforge/specs/<name>/spec.json
- .reforge/specs/<name>/tasks.json

## Write set
- .reforge/specs/<name>/tasks.json

## Procedure
1. Resolve target spec deterministically.
2. Read `spec.json`.
3. If `meta.approved` is not `true`, report blocked and recommend `reforge-render`.
4. Read `tasks.json` if it exists.
5. Create or update the task list based on `spec.json` `entities`.
   - The ordering of tasks MUST be deterministic (e.g. sorted alphabetically by entity name).
   - If a task for an entity already exists in `tasks.json`, preserve its `id`, `status`, and any completed subtasks.
   - If an entity was modified in the spec since the task was marked "done", you must re-evaluate it (e.g., set status back to "pending" or "in_progress" and clear subtask completion). For MVP, you can just reset the `verify_done` flag or explain the re-evaluation.
   - If an entity no longer exists in `spec.json`, remove its task or mark it as orphaned.
6. Write the updated `tasks.json`.
7. Output the planned tasks.

## Output format
Report the planned tasks clearly.

## Additional resources
- reference.md
- examples.md
