# Artifact Schema

<sub>[← Keelson Docs](../README.md) · English | [日本語](ja/spec-schema.md)</sub>

The approved artifact bundle is the source of truth.

Project-local canonical skills live separately in `.keelson/system/skills/`. Feature
artifacts live under `.keelson/features/`:

```text
.keelson/features/<feature>/
  manifest.json
  audit.md
  verify-report.md                   (after /keel-verify)
  01-requirements/requirements.md
  02-user-stories/user-stories.md
  02-user-stories/us-mock.html
  03-design/design.md
  04-prototype/prototype.html
  04-prototype/prototype-notes.md    (optional)
  05-plan/plan.md
```

Phase-owned files live in numbered subdirectories. Each phase's attachments (screenshots, notes, references, evidence) belong inside the matching subdirectory. Workspace-level files — `manifest.json`, `audit.md`, `verify-report.md` — stay at the feature top.

For a `/keel-quick` change, the workspace is flat:

```text
.keelson/features/<feature>/
  manifest.json        (with track: "quick")
  audit.md
  change.md
```

## Manifest

```json
{
  "version": 1,
  "feature": "team-invitations",
  "currentPhase": "prototype",
  "artifacts": {
    "requirements": { "path": "01-requirements/requirements.md", "phase": "requirements", "status": "approved" },
    "userStories": { "path": "02-user-stories/user-stories.md", "phase": "user-stories", "status": "approved" },
    "usMock": { "path": "02-user-stories/us-mock.html", "phase": "user-stories", "status": "approved" },
    "design": { "path": "03-design/design.md", "phase": "design", "status": "approved" },
    "prototype": { "path": "04-prototype/prototype.html", "phase": "prototype", "status": "draft" },
    "plan": { "path": "05-plan/plan.md", "phase": "plan", "status": "draft" }
  }
}
```

Paths are relative to `.keelson/features/<feature>/`. Skills resolve artifact locations via these `path` fields rather than guessing filenames, so layout changes do not require touching every skill.

Statuses are `draft`, `needs_revision`, or `approved`.

## Audit Trail

`audit.md` is a support file, not a manifest artifact and not a phase gate. It preserves continuity across sessions.

Required headings:

- `# Audit Trail`
- `## Chronological Log`
- `## Resume Point`

Each phase should append a dated log entry for the user input, agent decision, artifact changes, and validation result. The `Resume Point` section should be updated in place with the current phase, approved artifacts, next command, blockers, and last validation.
