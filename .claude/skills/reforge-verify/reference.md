# Reforge Verify Reference

## Guarantees and Limitations
- **Guaranteed**: Structural conformance (files exist), Field coverage (declared fields are referenced in code), Task completion (tasks.json matches implementation state).
- **Not Guaranteed**: Business logic correctness, UX/UI quality, performance, security.

## Checking Runtime Configuration
- Look for `spec.tech.testing`. If set, attempt to find test scripts in `package.json`.
- If unable to automatically run tests safely, or if not configured, output `skipped/not configured`.

## Remediation Hints
When an entity fails verification, always provide a clear, actionable hint.
- E.g. "Missing UI component for view 'list'. Create `src/components/UserList.tsx`."
