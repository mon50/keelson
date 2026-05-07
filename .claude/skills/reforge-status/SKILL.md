---
name: reforge-status
description: Inspect a Reforge workspace and report current phase, blockers, and the next recommended command. Never modify files.
disable-model-invocation: true
allowed-tools: Read Glob Grep
---

# Reforge Status

## Inputs
- Optional spec name: $ARGUMENTS

## Preconditions
- Repository is open
- Reforge workspace may or may not exist

## Read set
- .reforge/specs/<name>/spec.json
- .reforge/specs/<name>/questions.json
- .reforge/specs/<name>/tasks.json

## Write set
- None

## Output contract
Return:
- selected_spec
- current_phase
- blockers
- unresolved_questions
- approval_state
- task_summary
- last_verify_state
- next_recommended_command

## Procedure
1. Resolve the target spec deterministically.
2. Read workspace files without modifying them.
3. Determine the current phase.
4. Report blockers and exactly one recommended next command.
5. Do not ask questions and do not transition state.

## Failure modes
- no workspace
- multiple specs and no target
- invalid workspace files

## Additional resources
- reference.md
- examples.md
