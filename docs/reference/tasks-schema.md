# Plan Schema

Implementation tasks live in `plan.md`, not a JSON task queue.

Each task should include:

- stable id, for example `T-001`
- title
- source requirement or user story
- design references
- likely files to change
- implementation steps
- tests or checks
- acceptance criteria
- dependencies

`/keel-impl [task-id]` implements one task at a time and records implementation notes back in `plan.md`.
