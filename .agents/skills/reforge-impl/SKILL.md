---
name: reforge-impl
description: Implement one entity from the approved Reforge specification.
---

# Reforge Impl

Use this skill to implement one entity based on the approved spec.

Inputs:
- optional spec name and entity name

Read:
- .reforge/specs/<name>/spec.json
- .reforge/specs/<name>/tasks.json

Write:
- .reforge/specs/<name>/tasks.json
- project source files

Procedure:
1. Verify `meta.approved` is `true` and `tasks.json` exists.
2. Determine target entity.
3. Emit Preflight Report: spec name, entity, subtasks, expected files.
4. Set task status to `in_progress`.
5. Implement DB, API, UI, and Tests.
6. If failure occurs, revert task status to `pending`.
7. If success, set task status to `done`.
8. Emit Postflight Report: accurately enumerate changed files and state transition.
