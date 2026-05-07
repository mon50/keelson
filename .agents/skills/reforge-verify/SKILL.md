---
name: reforge-verify
description: Verify that the implementation matches the approved Reforge specification. Read-only.
---

# Reforge Verify

Use this skill to verify the implemented application matches the spec.

Inputs:
- optional spec name

Read:
- .reforge/specs/<name>/spec.json
- .reforge/specs/<name>/tasks.json
- Project source files

Write:
- none (read-only)

Procedure:
1. Print the Guarantee Boundary: structural conformance and field coverage are checked, but business logic and UX are NOT guaranteed.
2. Check Task Completion Consistency against `tasks.json`.
3. Check Structural Conformance for each entity (missing files, missing fields).
4. For any failure, provide a clear remediation hint.
5. If runtime checks (tests) are not configured, report `skipped/not configured`.
6. Output the final Verification Report.
