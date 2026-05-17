# CLI and Skills Reference

<sub>[← Keelson Docs](../README.md) · [English](../README.md#english) | [日本語](../README.md#日本語)</sub>

**Audience:** Daily users of Keelson.
**Prerequisites:** Keelson installed.
**Expected Outcome:** Know which command to use when.

## CLI
- `npx keelson install`: Copies canonical skills to `.keelson/skills`, installs forwarders to `.claude/skills` or `.agents/skills`, and adds `.keelson/` to `.gitignore` when missing.
- `npx keelson doctor`: Validates workspace.
- `npx keelson uninstall`: Removes Keelson.

## Skills
- `/keel-requirements "<idea>"` — create or revise `requirements.md`, initialize `manifest.json`, and create `audit.md`
- `/keel-us` — create `user-stories.md` and `us-mock.html`
- `/keel-design` — produce implementation design from approved requirements and stories
- `/keel-proto` — create the simplified prototype for review
- `/keel-plan` — create `plan.md` from approved artifacts
- `/keel-impl [task-id]` — implement one approved task

Each skill appends to `.keelson/<feature>/audit.md` and updates its `Resume Point` before handing control back to the user.
