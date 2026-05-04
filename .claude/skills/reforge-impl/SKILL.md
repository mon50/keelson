---
name: reforge-impl
allowed-tools: Read, Write, Edit, Bash, AskUserQuestion
argument-hint: [entity]
---

# reforge-impl

Implement one entity from the approved Reforge specification.

## Source of Truth

- Read `.reforge/spec.json` before any implementation work.
- Read `.reforge/tasks.json` to identify and update the target entity task.
- Do not depend on external libraries or helper scripts from this skill file.

## Execution Contract

1. Confirm `.reforge/spec.json` exists.
2. Confirm `meta.approved` is `true`.
3. Resolve the target entity from the optional `[entity]` argument, or from the first pending task in `.reforge/tasks.json`.
4. Implement only from information already present in `.reforge/spec.json`.
