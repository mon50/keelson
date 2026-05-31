# CLI and Skills Reference

<sub>[← Keelson Docs](../README.md) · English | [日本語](ja/cli-and-skills.md)</sub>

**Audience:** Daily users of Keelson.
**Prerequisites:** Keelson installed.
**Expected Outcome:** Know which command to use when.

## CLI
- `npx keelson-cli install`: Copies canonical skills to `.keelson/system/skills`, initializes `.keelson/features`, installs forwarders to `.claude/skills` or `.agents/skills`, and adds `.keelson/` to `.gitignore` when missing. Existing `.keelson/<feature>` workspaces are migrated into `.keelson/features/<feature>`.
- `npx keelson-cli doctor`: Validates workspace.
- `npx keelson-cli uninstall`: Removes Keelson.

## Skills
- `/keel-discovery "<idea>"` — the front door: route a rough or large idea into a small change, one feature, or several
- `/keel-steering` — create or update project-wide steering: product, tech, principles (run once, before feature work)
- `/keel-requirements "<idea>"` — create or revise `01-requirements/requirements.md`, initialize `manifest.json`, and create `audit.md`
- `/keel-us` — create `02-user-stories/user-stories.md` and `02-user-stories/us-mock.html`
- `/keel-design` — produce `03-design/design.md` from approved requirements and stories
- `/keel-proto` — create `04-prototype/prototype.html` (the simplified prototype) for review
- `/keel-plan` — create `05-plan/plan.md` from approved artifacts
- `/keel-impl [task-id]` — implement one approved task
- `/keel-verify` — audit the implementation against the approved artifacts and report gaps
- `/keel-quick "<change>"` — lightweight track for a small change or bug fix, in one gated skill
- `/keel-status` — report the current phase and recommend the next command (read-only)

Each skill appends to `.keelson/features/<feature>/audit.md` and updates its `Resume Point` before handing control back to the user.
