# Reforge Resume Reference

## Decision Tree
1. Is workspace missing? -> recommend `reforge-init`
2. Are there multiple specs and no target? -> fail, require target spec.
3. Are there pending questions? -> ask EXACTLY ONE question.
4. Did the user provide an answer? -> record answer, update spec resolving ONLY the specified paths, move question to answered, DO NOT ask another question.
5. Is the spec invalid? -> recommend `reforge-validate`
6. Is the spec unapproved? -> recommend `reforge-render`
7. Are there no tasks? -> recommend `reforge-plan`
8. Are there unfinished tasks? -> recommend `reforge-impl`
9. Are there tasks not verified? -> recommend `reforge-verify`
10. Otherwise -> complete

## Rules
- DO NOT emit a full status dashboard. Just state the next action.
- ONLY mutate files when recording an answer.
- NEVER guess values for spec fields.
