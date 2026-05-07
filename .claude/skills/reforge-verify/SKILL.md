---
name: reforge-verify
description: Verify that the implementation matches the approved Reforge specification. Read-only: this skill never writes or modifies files.
disable-model-invocation: true
allowed-tools: Read Bash Glob
---

# Reforge Verify

## Inputs
- Optional spec name: $ARGUMENTS

## Preconditions
- Target spec can be resolved deterministically

## Read set
- .reforge/specs/<name>/spec.json
- .reforge/specs/<name>/tasks.json
- Workspace source files

## Write set
- None. This command is strictly read-only.

## Procedure
1. Resolve target spec.
2. Read `spec.json` and `tasks.json`.
3. Inform the user of the **Guarantee Boundary**:
   - `reforge-verify` checks **Structural Conformance**, **Field Coverage**, and **Task Completion Consistency**.
   - It **does not** guarantee business correctness, UX quality, performance, or security completeness.
4. Perform **Task Completion Consistency Check**:
   - Verify all tasks in `tasks.json` are marked as `done`.
5. Perform **Structural Conformance & Field Coverage Checks** for each entity in the spec:
   - Check if DB migrations exist for the entity.
   - Check if API endpoints exist.
   - Check if UI components exist (form, list, detail depending on views).
   - Check field coverage: Ensure that the fields declared in `spec.json` appear in the generated API/UI code files.
6. Perform **Runtime Checks**:
   - Check if tests exist.
   - Run tests if a test command is available (e.g. `npm test`).
   - If tests are not configured, report `Runtime checks: skipped/not configured`.
7. Output the final Verification Report.
   - If any structural or coverage errors exist, emit a clear remediation hint for each.

## Output Format
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
- All tasks in tasks.json are marked as done. [pass]

Runtime Checks:
- skipped/not configured (no test command found)
=============================
```

## Additional resources
- reference.md
- examples.md
