# Reforge Verify Examples

## Example 1: Passed Verification
```text
=== Reforge Verify Report ===
Guarantee Boundaries:
- Checks structural conformance, field coverage, and task completion.
- Does NOT guarantee business correctness, UX, or security.

Structural Conformance:
- user: [pass]
- report: [pass]

Task Completion Consistency:
- All tasks in tasks.json are marked as done. [pass]

Runtime Checks:
- skipped/not configured (no test command found)
=============================
```

## Example 2: Failed Verification
```text
=== Reforge Verify Report ===
Guarantee Boundaries:
- Checks structural conformance, field coverage, and task completion.
- Does NOT guarantee business correctness, UX, or security.

Structural Conformance:
- user: [pass]
- report: [fail] Missing field 'status' in API endpoint.
  Remediation: Add 'status' field handling to src/app/api/report/route.ts.

Task Completion Consistency:
- Task 'report' is done in tasks.json, but implementation is incomplete. [fail]
  Remediation: Run reforge-impl report to fix the implementation.

Runtime Checks:
- skipped/not configured
=============================
```
