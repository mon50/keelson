# Artifact Schema

<sub>[← Keelson Docs](../README.md) · English | [日本語](ja/spec-schema.md)</sub>

The approved artifact bundle is the source of truth.

```text
.keelson/<feature>/
  manifest.json
  audit.md
  requirements.md
  user-stories.md
  us-mock.html
  design.md
  prototype.html
  plan.md
```

## Manifest

```json
{
  "version": 1,
  "feature": "team-invitations",
  "currentPhase": "prototype",
  "artifacts": {
    "requirements": { "path": "requirements.md", "phase": "requirements", "status": "approved" },
    "userStories": { "path": "user-stories.md", "phase": "user-stories", "status": "approved" },
    "usMock": { "path": "us-mock.html", "phase": "user-stories", "status": "approved" },
    "design": { "path": "design.md", "phase": "design", "status": "approved" },
    "prototype": { "path": "prototype.html", "phase": "prototype", "status": "draft" },
    "plan": { "path": "plan.md", "phase": "plan", "status": "draft" }
  }
}
```

Statuses are `draft`, `needs_revision`, or `approved`.

## Audit Trail

`audit.md` is a support file, not a manifest artifact and not a phase gate. It preserves continuity across sessions.

Required headings:

- `# Audit Trail`
- `## Chronological Log`
- `## Resume Point`

Each phase should append a dated log entry for the user input, agent decision, artifact changes, and validation result. The `Resume Point` section should be updated in place with the current phase, approved artifacts, next command, blockers, and last validation.
