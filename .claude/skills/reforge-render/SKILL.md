---
name: reforge-render
description: Start a local HTML prototype server from .reforge/spec.json and run the approval flow that writes meta.approved to spec.json.
disable-model-invocation: true
allowed-tools: Read Bash Write AskUserQuestion
---

# Reforge Render

## Inputs
- Optional spec name: $ARGUMENTS

## Preconditions
- Repository is open
- Target spec can be resolved deterministically

## Read set
- .reforge/specs/<name>/spec.json
- .reforge/specs/<name>/questions.json

## Write set
- .reforge/specs/<name>/spec.json (only when recording approval)

## Procedure
1. Resolve target spec deterministically.
2. Read `spec.json`. If missing, report error.
3. Warn if `questions.json` has pending questions.
4. Start the server (find entry point from `.reforge/server/index.js` or `reforge-renderer/dist/index.js`).
5. Wait for the server to start.
6. Display instructions for the user:
   - Provide the URL to open.
   - Explain how to approve, reject, or stop the server.
7. If the spec is already approved (`meta.approved` is true):
   - Just preview it.
8. If not approved, ask the user if they approve.
9. If approved:
   - Update `meta.approved` to `true`.
   - Add an audit trail field `meta.approvedAt` (ISO string).
   - Add an audit trail field `meta.approvedDigest` (a hash of the spec content or simple timestamp).
   - Write `spec.json`.
   - Recommend next command: `reforge-plan`.
10. If rejected:
   - Recommend next command: `reforge-update` followed by `reforge-validate` and `reforge-render`.
11. Stop the server after receiving the user's decision.

## Additional resources
- reference.md
- examples.md
