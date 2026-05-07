# Reforge Impl Reference

## Implementation Scope
- You must strictly implement what is declared in `spec.json`.
- Do not invent fields, views, or flows that are not specified.

## Task States
- `pending`: Not started.
- `in_progress`: Currently being implemented. If an error occurs, it MUST be reverted to `pending`.
- `done`: Fully implemented and tests added.

## Preflight / Postflight
The preflight report informs the user of the plan before mutations occur. The postflight report accurately enumerates the files that were modified.
