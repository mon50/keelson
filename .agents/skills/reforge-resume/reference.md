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

## Phase Map (always output as line 1)

8 lifecycle phases shown horizontally. `[✓]` passed, `[▶]` current, `[ ]` upcoming.

Fixed format:
```
進行: [?]Init → [?]Questions → [?]Validate → [?]Approve → [?]Plan → [?]Impl → [?]Verify → [?]Done  (現在番号/8)
```

Decision-tree branch → current phase mapping:
- 1 (workspace missing) → Init (1/8)
- 3 (pending question) → Questions (2/8); previous: Init
- 5 (invalid spec) → Validate (3/8); previous: Init, Questions
- 6 (unapproved) → Approve (4/8); previous: Init, Questions, Validate
- 7 (no tasks) → Plan (5/8); previous: through Approve
- 8 (unfinished tasks) → Impl (6/8); previous: through Plan
- 9 (not verified) → Verify (7/8); previous: through Impl
- 10 (otherwise) → Done (8/8); all `[✓]`, no `[▶]`

## NextAction (line 3)

Format: `NextAction: <user action> → <command>`. Examples:
- Branch 3 (pending question): `NextAction: 提示した質問に回答 → reforge-resume を再実行`
- Branch 6 (unapproved): `NextAction: UI プロトタイプを承認 → reforge-render`
- Branch 7 (no tasks): `NextAction: タスクキュー生成 → reforge-plan`
- Branch 8 (unfinished tasks): `NextAction: 次タスクを実装 → reforge-impl <entity>`

## Rules
- ALWAYS emit the 3-line header (phase map / current / NextAction). This is not a "full dashboard" — it is a single-line status plus the action.
- ONLY mutate files when recording an answer.
- NEVER guess values for spec fields.
