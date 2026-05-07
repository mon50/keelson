---
name: reforge-status
description: Show the current Reforge phase, blockers, and the next recommended command without modifying files.
---

# Reforge Status

Use this skill only when the user wants to inspect workflow state.

Inputs:
- optional spec name

Read:
- .reforge/specs/<name>/spec.json
- .reforge/specs/<name>/questions.json
- .reforge/specs/<name>/tasks.json

Write:
- none

Return:
- selected spec
- current phase
- blockers
- unresolved question count
- approval state
- task summary
- next recommended command

Do not ask a question.
Do not modify files.
If multiple specs exist and no target is given, return an explicit ambiguity message.
