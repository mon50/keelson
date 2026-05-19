# CLI and Skills Reference

<sub>[← Keelson Docs](../README.md) · English | [日本語](ja/cli-and-skills.md)</sub>

**Audience:** Daily users of Keelson.
**Prerequisites:** Keelson installed.
**Expected Outcome:** Know which command to use when.

## CLI
- `npx keelson-cli install`: Copies canonical skills to `.keelson/skills`, installs forwarders to `.claude/skills` or `.agents/skills`, and adds `.keelson/` to `.gitignore` when missing.
- `npx keelson-cli doctor`: Validates workspace.
- `npx keelson-cli uninstall`: Removes Keelson.

## Skills
- `/keel-steering` — create or update project-wide steering: product, tech, principles (run once, before feature work)
- `/keel-requirements "<idea>"` — create or revise `requirements.md`, initialize `manifest.json`, and create `audit.md`
- `/keel-us` — create `user-stories.md` and `us-mock.html`
- `/keel-design` — produce implementation design from approved requirements and stories
- `/keel-proto` — create the simplified prototype for review
- `/keel-plan` — create `plan.md` from approved artifacts
- `/keel-impl [task-id]` — implement one approved task
- `/keel-verify` — audit the implementation against the approved artifacts and report gaps
- `/keel-status` — report the current phase and recommend the next command (read-only)

Each skill appends to `.keelson/<feature>/audit.md` and updates its `Resume Point` before handing control back to the user.
