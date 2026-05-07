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

## Target Spec Resolution
- If input is provided, use it.
- If only one spec exists in `.reforge/specs/`, use it.
- If multiple exist and no input is provided, fail with ambiguity message.
