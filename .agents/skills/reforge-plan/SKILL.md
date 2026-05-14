---
name: reforge-plan
description: Generate an implementation task plan from approved Requirements, User Stories, US mock, Design, and Prototype artifacts.
allowed-tools: Read, Write, Edit, AskUserQuestion
---

# reforge-plan

## Purpose

Create `plan.md` for implementation.

## Inputs

- `requirements.md`
- `user-stories.md`
- `us-mock.md`
- `design.md`
- `prototype.html`
- `manifest.json`

Block unless `artifacts.requirements.status`, `artifacts.userStories.status`, `artifacts.usMock.status`, `artifacts.design.status`, and `artifacts.prototype.status` are `approved`.

## Plan.md Contract

`plan.md` must contain:

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

Tasks should be vertical enough to verify, but small enough for one `/reforge-impl` iteration.

## Manifest Update

After approval, set `artifacts.plan.status` to `approved` and `currentPhase` to `implementation`.

## Quality Gate

- No task may rely only on the prototype; each task must trace to `design.md` and at least one requirement or user story.
- No task may modify files listed under `Files Not To Touch`.
- The plan must be suitable for cc-sdd-style implementation: one task, tests, review, then next task.
- Report changed files and next gate: `/reforge-impl`.
