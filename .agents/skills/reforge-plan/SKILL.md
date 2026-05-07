---
name: reforge-plan
description: Generate or update tasks.json deterministically from spec.json entities.
---

# Reforge Plan

Use this skill to generate the implementation plan from the approved spec.

Inputs:
- optional spec name

Read:
- .reforge/specs/<name>/spec.json
- .reforge/specs/<name>/tasks.json

Write:
- .reforge/specs/<name>/tasks.json

Procedure:
1. Verify `meta.approved` is `true`. If not, stop and recommend `reforge-render`.
2. Generate tasks deterministically, sorted by entity name.
3. If tasks already exist, preserve their state. If the spec for an entity changed, reset its status to pending.
4. Output the planned tasks.
