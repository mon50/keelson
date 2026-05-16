# Artifact Schema

Reforge no longer has a single specification JSON. The approved artifact bundle is the source of truth.

```text
.reforge/<feature>/
  manifest.json
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
