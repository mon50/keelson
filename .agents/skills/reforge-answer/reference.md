# Reforge Answer Reference

## Decision Tree
1. Is workspace missing? -> blocked
2. Are there multiple specs and no target? -> blocked, require target spec.
3. Are there pending questions? -> ask EXACTLY ONE question.
4. Did the user provide an answer? -> record answer, update spec resolving ONLY the specified paths, move question to answered. DO NOT ask another question.
5. Otherwise -> complete (no pending questions; report and stop)

## Rules
- DO NOT emit a phase map, NextAction, or status dashboard.
- DO NOT recommend a next command. Manual-mode users decide which phase command (`reforge-validate`, `reforge-render`, `reforge-plan`, `reforge-impl`, `reforge-verify`) to run next.
- ONLY mutate files when recording an answer.
- NEVER guess values for spec fields.

## Skill boundary
- `reforge-answer` — Q&A only. Manual mode.
- `reforge-resume` — Q&A + phase routing. Navigator mode.
- `reforge-status` — read-only inspection of workspace state.
