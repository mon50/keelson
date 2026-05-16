# CLI and Skills Reference

**Audience:** Daily users of Reforge.
**Prerequisites:** Reforge installed.
**Expected Outcome:** Know which command to use when.

## CLI
- `npx aid-reforge install`: Copies canonical skills to `.reforge/skills`, installs forwarders to `.claude/skills` or `.agents/skills`, and adds `.reforge/` to `.gitignore` when missing.
- `npx aid-reforge doctor`: Validates workspace.
- `npx aid-reforge uninstall`: Removes Reforge.

## Skills
- `/reforge-requirements "<idea>"` — create or revise `requirements.md`
- `/reforge-us` — create `user-stories.md` and `us-mock.html`
- `/reforge-design` — produce implementation design from approved requirements and stories
- `/reforge-proto` — create the simplified prototype for review
- `/reforge-plan` — create `plan.md` from approved artifacts
- `/reforge-impl [task-id]` — implement one approved task
