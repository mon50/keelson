---
name: keel-requirements
description: Start or revise the AI-DLC Requirements phase. Creates requirements.md, manifest.json, and audit.md as the first Keelson workspace files.
allowed-tools: Read, Write, Edit, Glob, AskUserQuestion
argument-hint: "\"<idea>\""
---

# keel-requirements

## Purpose

Turn a product idea into an AI-DLC-style Requirements artifact.

## Workspace

Use `.keelson/<feature>/` for feature artifacts. Write open questions inside the artifact that owns them.

Read `.keelson/steering/*.md` if present and honor the project's product, tech, and principles.

Required files after this phase:

- `01-requirements/requirements.md` - AI-DLC Requirements, including purpose, users, scope, constraints, acceptance signals, and open questions.
- `manifest.json` (workspace top) - artifact index, phase status, digests when known.
- `audit.md` (workspace top) - chronological interaction log and resume point for the next session.

Workspace layout for the feature (full track):

```
.keelson/<feature>/
  manifest.json
  audit.md
  verify-report.md            (after keel-verify)
  01-requirements/requirements.md
  02-user-stories/user-stories.md
  02-user-stories/us-mock.html
  03-design/design.md
  04-prototype/prototype.html
  04-prototype/prototype-notes.md   (optional)
  05-plan/plan.md
```

`manifest.json`, `audit.md`, and `verify-report.md` stay at the feature top because they describe the workspace as a whole. Phase-owned files live in numbered subdirectories; attachments (images, notes, references) for a phase belong inside that phase's subdirectory.

`manifest.json` is an index only. The source of truth is the approved artifact text.
`audit.md` is continuity metadata only. It is not a phase-gated specification artifact.

## Flow

1. Resolve `<feature>` from the argument or an existing `.keelson/<feature>/manifest.json`.
2. If no idea is provided and no requirements artifact exists, ask for one concise product idea.
3. Inspect only lightweight repository context when the idea mentions an existing app: package/config files, route/component directories, component/style directories, README, and obvious test setup.
4. Create `audit.md` if missing, append the initial user request and repository findings, and initialize `## Resume Point`.
5. Write or update `01-requirements/requirements.md`.
6. Ask the user whether the requirements are approved.
7. If approved, set `artifacts.requirements.status` to `approved` in `manifest.json`.
8. If not approved, set `artifacts.requirements.status` to `needs_revision` and keep the next gate as `/keel-requirements`.
9. Append the approval or revision result to `audit.md` and update `## Resume Point` before reporting.

## Requirements.md Contract

`01-requirements/requirements.md` must contain these headings:

- `# Requirements`
- `## Product Intent`
- `## Users`
- `## In Scope`
- `## Out of Scope`
- `## Acceptance Signals`
- `## UI Design Expectations`
- `## Constraints`
- `## Open Questions`
- `## Next Gate`

Write open questions directly in `01-requirements/requirements.md`.

`## UI Design Expectations` must capture user-facing design requirements without choosing implementation details:

- visual references, brand tone, density, and interaction feel the user expects
- existing product, page, component, or design-system evidence that should be followed
- key responsive, accessibility, empty-state, loading-state, and error-state expectations
- any UI directions that are unknown and need user confirmation

## Manifest Contract

Minimum manifest:

```json
{
  "version": 1,
  "feature": "feature-slug",
  "currentPhase": "requirements",
  "artifacts": {
    "requirements": { "path": "01-requirements/requirements.md", "phase": "requirements", "status": "draft" },
    "userStories": { "path": "02-user-stories/user-stories.md", "phase": "user-stories", "status": "draft" },
    "usMock": { "path": "02-user-stories/us-mock.html", "phase": "user-stories", "status": "draft" },
    "design": { "path": "03-design/design.md", "phase": "design", "status": "draft" },
    "prototype": { "path": "04-prototype/prototype.html", "phase": "prototype", "status": "draft" },
    "plan": { "path": "05-plan/plan.md", "phase": "plan", "status": "draft" }
  }
}
```

Paths are stored relative to `.keelson/<feature>/`. Skills must use these paths from `manifest.json` rather than hardcoding bare filenames.

## Audit.md Contract

Use this structure:

```markdown
# Audit Trail

## Chronological Log

### YYYY-MM-DDTHH:MM:SSZ - Requirements
- User input: <raw user request or N/A>
- Agent action: <requirements decisions and files changed>
- Validation: <checks run or not run>

## Resume Point
- Current phase:
- Current status:
- Next command:
- Approved artifacts:
- Open blockers:
- Last validation:
```

Append new log entries; do not replace prior history. Update only the `## Resume Point` section in place. Preserve raw user wording when available, but redact secrets, tokens, and credentials.

## Quality Gate

- Do not invent users, business rules, permissions, or success criteria.
- Never guess an unknown to move faster. Record it under `## Open Questions` or ask with AskUserQuestion; an unresolved question blocks approval.
- Do not leave UI design expectations implicit when the feature has a user-facing surface.
- If the user story or prototype phase found a mismatch, fold that feedback back into `01-requirements/requirements.md`.
- Keep requirements implementation-neutral. Implementation choices belong in `/keel-design`.
- `audit.md` records what changed and identifies the next command.
- Report changed files and next gate: `/keel-us` when approved, otherwise `/keel-requirements`.
