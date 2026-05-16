---
name: reforge-requirements
description: Start or revise the AI-DLC Requirements phase. Creates requirements.md, manifest.json, and audit.md as the first Reforge workspace files.
allowed-tools: Read, Write, Edit, Glob, AskUserQuestion
argument-hint: "\"<idea>\""
---

# reforge-requirements

## Purpose

Turn a product idea into an AI-DLC-style Requirements artifact.

## Workspace

Use `.reforge/<feature>/` for feature artifacts. Write open questions inside the artifact that owns them.

Required files after this phase:

- `requirements.md` - AI-DLC Requirements, including purpose, users, scope, constraints, acceptance signals, and open questions.
- `manifest.json` - artifact index, phase status, digests when known.
- `audit.md` - chronological interaction log and resume point for the next session.

`manifest.json` is an index only. The source of truth is the approved artifact text.
`audit.md` is continuity metadata only. It is not a phase-gated specification artifact.

## Flow

1. Resolve `<feature>` from the argument or an existing `.reforge/<feature>/manifest.json`.
2. If no idea is provided and no requirements artifact exists, ask for one concise product idea.
3. Inspect only lightweight repository context when the idea mentions an existing app: package/config files, route/component directories, component/style directories, README, and obvious test setup.
4. Create `audit.md` if missing, append the initial user request and repository findings, and initialize `## Resume Point`.
5. Write or update `requirements.md`.
6. Ask the user whether the requirements are approved.
7. If approved, set `artifacts.requirements.status` to `approved` in `manifest.json`.
8. If not approved, set `artifacts.requirements.status` to `needs_revision` and keep the next gate as `/reforge-requirements`.
9. Append the approval or revision result to `audit.md` and update `## Resume Point` before reporting.

## Requirements.md Contract

The file must contain these headings:

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

Write open questions directly in `requirements.md`; do not maintain a separate question queue.

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
    "requirements": { "path": "requirements.md", "phase": "requirements", "status": "draft" },
    "userStories": { "path": "user-stories.md", "phase": "user-stories", "status": "draft" },
    "usMock": { "path": "us-mock.html", "phase": "user-stories", "status": "draft" },
    "design": { "path": "design.md", "phase": "design", "status": "draft" },
    "prototype": { "path": "prototype.html", "phase": "prototype", "status": "draft" },
    "plan": { "path": "plan.md", "phase": "plan", "status": "draft" }
  }
}
```

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
- Do not leave UI design expectations implicit when the feature has a user-facing surface.
- If the user story or prototype phase found a mismatch, fold that feedback back into `requirements.md`.
- Keep requirements implementation-neutral. Implementation choices belong in `/reforge-design`.
- `audit.md` records what changed and identifies the next command.
- Report changed files and next gate: `/reforge-us` when approved, otherwise `/reforge-requirements`.
