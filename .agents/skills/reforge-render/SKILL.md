---
name: reforge-render
description: Start a local HTML prototype server from .reforge/spec.json and run the approval flow.
---

# Reforge Render

Use this skill to review the UI prototype and approve the spec.

Inputs:
- optional spec name

Read:
- .reforge/specs/<name>/spec.json
- .reforge/specs/<name>/questions.json

Write:
- .reforge/specs/<name>/spec.json (only when recording approval)

Procedure:
1. Start the server via `node .reforge/server/index.js` or `node reforge-renderer/dist/index.js`.
2. Provide the URL to the user.
3. Explain options: open, approve, reject, stop.
4. If the user approves, write `meta.approved = true`, `meta.approvedAt`, and `meta.approvedDigest` to `spec.json`. Recommend `reforge-plan`.
5. If the user rejects, stop the server and recommend `reforge-update`, then `reforge-validate`, then `reforge-render`.
