---
name: keel-status
description: Report the current Keelson phase and recommend the next command by reading manifest.json and audit.md. Read-only; never edits artifacts.
allowed-tools: Read, Glob, AskUserQuestion
---

# keel-status

## Purpose

Tell the user where the workflow stands and which command to run next. This is a read-only navigator: it never creates or edits artifacts.

## Inputs

- `.keelson/features/<feature>/manifest.json` - phase index and artifact statuses; resolve each artifact's actual location via its `path` field rather than guessing filenames
- `.keelson/features/<feature>/audit.md` - chronological log and `## Resume Point`

Feature workspaces use numbered subdirectories for phase-owned files (e.g. `01-requirements/requirements.md`, `02-user-stories/us-mock.html`, …). `manifest.json`, `audit.md`, and `verify-report.md` stay at the feature top.

Resolve `<feature>`:

1. If exactly one `.keelson/features/<feature>/` workspace exists, use it.
2. If several exist, ask the user which feature to report.
3. If none exist, report that no workspace is present and recommend `/keel-discovery "<idea>"` for a rough or large idea, or `/keel-requirements "<idea>"` for a clear single feature.

## Status Report Contract

Report, without editing any file:

- Feature name and `currentPhase` from `manifest.json`.
- Each artifact status: `requirements`, `userStories`, `usMock`, `design`, `prototype`, `plan` as `draft`, `needs_revision`, or `approved`.
- For a `track: "quick"` manifest, report the single `change` artifact's status instead of the six phase artifacts.
- Open blockers and the last validation, taken from the `## Resume Point` section of `audit.md`.
- The recommended next command (see Next Command Logic).
- A note when `audit.md` and `manifest.json` disagree, so the user can resolve it.

## Next Command Logic

If `manifest.json` has `track: "quick"`, recommend `/keel-quick` while the `change` artifact (`change.md` at the feature top) is `draft` or `needs_revision`, and `/keel-verify` once it is `approved`. Otherwise evaluate the feature-track rules below.

Evaluate in order and recommend the first match:

1. Any artifact is `needs_revision` -> the command that owns it: `requirements` -> `/keel-requirements`, `userStories` or `usMock` -> `/keel-us`, `design` -> `/keel-design`, `prototype` -> `/keel-proto`, `plan` -> `/keel-plan`.
2. `requirements` not `approved` -> `/keel-requirements`.
3. `userStories` or `usMock` not `approved` -> `/keel-us`.
4. `design` not `approved` -> `/keel-design`.
5. `prototype` not `approved` -> `/keel-proto`.
6. `plan` not `approved` -> `/keel-plan`.
7. All artifacts `approved` -> `/keel-impl` for the next pending task in `05-plan/plan.md`.

When several artifacts need revision, recommend the earliest phase first so upstream fixes land before downstream ones.

## Quality Gate

- Never write or edit `manifest.json`, `audit.md`, or any artifact. Recommend a command; do not run the phase.
- Do not invent status. If an artifact or `manifest.json` is missing, say so and route to the phase that creates it.
- Prefer `manifest.json` for artifact status and `audit.md` `## Resume Point` for narrative context; surface any conflict instead of silently choosing one.
- Report only: feature, current phase, artifact statuses, blockers, and the single recommended next command.
