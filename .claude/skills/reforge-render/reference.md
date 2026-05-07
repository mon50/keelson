# Reforge Render Reference

## Server Paths
1. Installed project: `node .reforge/server/index.js`
2. Source dev: `node reforge-renderer/dist/index.js`

## Audit Trail
When the user approves the spec, you must update `spec.json` with an audit trail:
- `meta.approved`: true
- `meta.approvedAt`: Current ISO timestamp
- `meta.approvedDigest`: (Optional) A hash or snapshot identifier to invalidate if the spec changes.

## Rejection Flow
If the user rejects the prototype, stop the server and recommend:
`reforge-update` -> `reforge-validate` -> `reforge-render`
