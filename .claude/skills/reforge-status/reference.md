# Reforge Status Reference

## Phases
1. **init**: No workspace exists. Next: `reforge-init`
2. **ideation**: Pending questions in `questions.json`. Next: `reforge-resume`
3. **validation**: No pending questions, spec not validated. Next: `reforge-validate`
4. **approval**: Validated, but `meta.approved` is false. Next: `reforge-render`
5. **planning**: Approved, but `tasks.json` is missing or outdated. Next: `reforge-plan`
6. **implementation**: Tasks planned but not all completed. Next: `reforge-impl`
7. **verification**: All tasks complete, pending verification. Next: `reforge-verify`
8. **complete**: Verified and complete.

## Blockers
Blockers are states that prevent moving to the next phase until resolved. For example:
- `invalid_spec`: Syntax error or missing required fields in `spec.json`.
- `unresolved_questions`: Must answer questions before approval.
- `unapproved`: Cannot plan without approval.
- `failing_tests`: Implementation tasks cannot be verified if broken.

## Target Spec Resolution
- If `$ARGUMENTS` is provided, use it.
- If only one spec exists in `.reforge/specs/`, use it.
- If multiple exist and no `$ARGUMENTS` is provided, fail with `ambiguous_spec`.
