---
name: reforge-resume
description: Advance a Reforge workflow by exactly one safe step. Ask one pending question, record one answer, or return one next action.
disable-model-invocation: true
allowed-tools: Read Edit MultiEdit Glob Grep
---

# Reforge Resume

## Inputs
- Optional spec name: $ARGUMENTS

## Preconditions
- Repository is open
- Target spec can be resolved deterministically

## Read set
- .reforge/specs/<name>/spec.json
- .reforge/specs/<name>/questions.json
- .reforge/specs/<name>/tasks.json

## Write set
- spec.json and questions.json only when recording an answer
- otherwise none

## Output contract
Return exactly one of:
- ask_question
- record_answer
- recommend_command
- complete

## Procedure
1. Resolve target spec deterministically.
2. Evaluate the lifecycle decision tree.
3. If a pending question exists, show exactly one question.
4. If the user answers it, write only the paths listed in `resolves`.
5. If no question is pending, return exactly one next action and why.
6. Never emit a full dashboard summary. Use reforge-status for inspection.

## Failure modes
- no workspace
- multiple specs and no target
- invalid workspace files
- ambiguous answer that cannot safely resolve paths

## Additional resources
- reference.md
- examples.md
