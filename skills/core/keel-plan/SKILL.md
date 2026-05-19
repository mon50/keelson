---
name: keel-plan
description: Generate an implementation task plan from approved Requirements, User Stories, US mock, Design, and Prototype artifacts.
allowed-tools: Read, Write, Edit, AskUserQuestion
---

# keel-plan

## Purpose

Create `05-plan/plan.md` for implementation.

## Inputs

- `01-requirements/requirements.md`
- `02-user-stories/user-stories.md`
- `02-user-stories/us-mock.html`
- `03-design/design.md`
- `04-prototype/prototype.html`
- `manifest.json` (workspace top)
- `audit.md` (workspace top) if present; create it if missing.
- `.keelson/steering/*.md` if present — honor the project's product, tech, and principles.

Block unless `artifacts.requirements.status`, `artifacts.userStories.status`, `artifacts.usMock.status`, `artifacts.design.status`, and `artifacts.prototype.status` are `approved`.

Read `audit.md` first to recover previous decisions and the current `## Resume Point`.

## Plan.md Contract

Output file: `05-plan/plan.md`. Phase attachments (sequencing diagrams, dependency analysis, risk notes) belong under `05-plan/`.

`05-plan/plan.md` must contain:

- `# Implementation Plan`
- `## Source Artifacts`
- `## Task List`
- `## Task Details`
- `## Test Plan`
- `## Review Gates`
- `## Out Of Scope`

Each task must have:

- stable id such as `T-001`
- title
- source story/design reference
- files likely to change
- implementation steps
- tests or checks
- acceptance criteria
- dependencies

Tasks should be vertical enough to verify, but small enough for one `/keel-impl` iteration.

## Manifest Update

After approval, set `artifacts.plan.status` to `approved` and `currentPhase` to `implementation`.
Append the plan approval or revision result to `audit.md`, including selected next task if known, and update `## Resume Point`.

## Quality Gate

- No task may rely only on the prototype; each task must trace to `03-design/design.md` and at least one requirement or user story.
- Never invent tasks, files, or acceptance criteria that do not trace to an approved artifact. Missing detail routes back to the owning phase; it is not guessed.
- No task may modify files listed under `Files Not To Touch`.
- The plan must be suitable for Kiro-style implementation: one task, tests, review, then next task.
- `audit.md` records plan decisions, approval status, and the next implementation command.
- Report changed files and next gate: `/keel-impl`.
