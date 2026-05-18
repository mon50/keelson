---
name: keel-status
description: Report the current Keelson phase and recommend the next command by reading manifest.json and audit.md. Read-only; never edits artifacts.
allowed-tools: Read, Glob, AskUserQuestion
---

# keel-status

## Purpose

Tell the user where the workflow stands and which command to run next. This is a read-only navigator: it never creates or edits artifacts.

## Inputs

- `.keelson/<feature>/manifest.json` - phase index and artifact statuses
- `.keelson/<feature>/audit.md` - chronological log and `## Resume Point`

Resolve `<feature>`:

1. If exactly one `.keelson/<feature>/` workspace exists, use it.
2. If several exist, ask the user which feature to report.
3. If none exist, report that no workspace is present and recommend `/keel-requirements "<idea>"`.

## Status Report Contract

Report, without editing any file:

- Feature name and `currentPhase` from `manifest.json`.
- Each artifact status: `requirements`, `userStories`, `usMock`, `design`, `prototype`, `plan` as `draft`, `needs_revision`, or `approved`.
- Open blockers and the last validation, taken from the `## Resume Point` section of `audit.md`.
- The recommended next command (see Next Command Logic).
- A note when `audit.md` and `manifest.json` disagree, so the user can resolve it.

## Next Command Logic

Evaluate in order and recommend the first match:

1. Any artifact is `needs_revision` -> the command that owns it: `requirements` -> `/keel-requirements`, `userStories` or `usMock` -> `/keel-us`, `design` -> `/keel-design`, `prototype` -> `/keel-proto`, `plan` -> `/keel-plan`.
2. `requirements` not `approved` -> `/keel-requirements`.
3. `userStories` or `usMock` not `approved` -> `/keel-us`.
4. `design` not `approved` -> `/keel-design`.
5. `prototype` not `approved` -> `/keel-proto`.
6. `plan` not `approved` -> `/keel-plan`.
7. All artifacts `approved` -> `/keel-impl` for the next pending task in `plan.md`.

When several artifacts need revision, recommend the earliest phase first so upstream fixes land before downstream ones.

## Quality Gate

- Never write or edit `manifest.json`, `audit.md`, or any artifact. Recommend a command; do not run the phase.
- Do not invent status. If an artifact or `manifest.json` is missing, say so and route to the phase that creates it.
- Prefer `manifest.json` for artifact status and `audit.md` `## Resume Point` for narrative context; surface any conflict instead of silently choosing one.
- Report only: feature, current phase, artifact statuses, blockers, and the single recommended next command.
