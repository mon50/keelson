---
name: keel-proto
description: Create or revise the simplified prototype from approved user stories, US mock, and design.
allowed-tools: Read, Write, Edit, Glob, Bash, AskUserQuestion
---

# keel-proto

## Purpose

Create a simple prototype that validates the user-story experience and the design direction before implementation planning.

## Inputs

- `requirements.md`
- `user-stories.md`
- `us-mock.html`
- `design.md`
- `manifest.json`
- `audit.md` if present; create it if missing.

Block unless `artifacts.requirements.status`, `artifacts.userStories.status`, `artifacts.usMock.status`, and `artifacts.design.status` are `approved`.

## Outputs

- `prototype.html`
- optional `prototype-notes.md`
- updated `manifest.json`
- updated `audit.md`

## Continuity

Read `audit.md` before prototyping to recover prior decisions and the current `## Resume Point`. Append prototype decisions, review result, and validation notes. Update `## Resume Point` before reporting.

## Prototype Contract

The prototype must:

- demonstrate each user story's core operation from `us-mock.html`
- use copy and states aligned with requirements
- follow the UI composition and existing-implementation evidence in `design.md`
- stay simple: static HTML/CSS/JS is enough
- avoid protected branding or exact trade dress unless the user owns it
- include visible empty/error/success states when the US mock requires them

## Review Loop

After writing `prototype.html`, ask the user whether the prototype proves the intended experience.

- If the experience is wrong, mark `artifacts.usMock.status` as `needs_revision` and route to `/keel-us`.
- If the prototype contradicts implementation design or existing UI evidence, mark `artifacts.design.status` as `needs_revision` and route to `/keel-design`.
- If approved, set `artifacts.prototype.status` to `approved`.

## Quality Gate

- Prototype covers every approved user story or explicitly marks manual-only stories.
- Prototype reflects design file boundaries and existing UI direction.
- Prototype does not become the implementation contract by itself; `design.md` remains the implementation source.
- `audit.md` records prototype validation outcome and the next command.
- Report changed files and next gate: `/keel-plan`.
