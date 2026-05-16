---
name: reforge-requirements
description: Start or revise the AI-DLC Requirements phase. Creates requirements.md and manifest.json as the first Reforge artifacts.
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

`manifest.json` is an index only. The source of truth is the approved artifact text.

## Flow

1. Resolve `<feature>` from the argument or an existing `.reforge/<feature>/manifest.json`.
2. If no idea is provided and no requirements artifact exists, ask for one concise product idea.
3. Inspect only lightweight repository context when the idea mentions an existing app: package/config files, route/component directories, component/style directories, README, and obvious test setup.
4. Write or update `requirements.md`.
5. Ask the user whether the requirements are approved.
6. If approved, set `artifacts.requirements.status` to `approved` in `manifest.json`.
7. If not approved, set `artifacts.requirements.status` to `needs_revision` and keep the next gate as `/reforge-requirements`.

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

## Quality Gate

- Do not invent users, business rules, permissions, or success criteria.
- Do not leave UI design expectations implicit when the feature has a user-facing surface.
- If the user story or prototype phase found a mismatch, fold that feedback back into `requirements.md`.
- Keep requirements implementation-neutral. Implementation choices belong in `/reforge-design`.
- Report changed files and next gate: `/reforge-us` when approved, otherwise `/reforge-requirements`.
