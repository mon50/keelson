---
name: keel-design
description: Produce a Kiro-style design from approved requirements and user stories, grounded in existing implementation when present.
allowed-tools: Read, Write, Edit, Glob, Bash, AskUserQuestion
---

# keel-design

## Purpose

Turn approved requirements, user stories, and US mock operations into a concrete implementation design. This is close to Kiro Design, but still belongs before prototype approval.

## Inputs

- `requirements.md`
- `user-stories.md`
- `us-mock.html`
- `manifest.json`
- `audit.md` if present; create it if missing.
- `.keelson/steering/*.md` if present — honor the project's product, tech, and principles.

Block unless `artifacts.requirements.status`, `artifacts.userStories.status`, and `artifacts.usMock.status` are `approved`.

Read `audit.md` first to recover prior decisions and the current `## Resume Point`.

## Repository Inspection

When this is a brownfield feature, inspect existing implementation evidence before writing design:

- package and framework config
- routing directories
- component directories
- design-system, style, theme, or token files
- API/server directories
- database schema or migration directories
- test patterns
- existing UI examples relevant to the feature

Do not claim full repository understanding. Record evidence and uncertainty.

## Design.md Contract

`design.md` must contain:

- `# Design`
- `## Source Artifacts`
- `## Existing Implementation Evidence`
- `## Architecture`
- `## Data Model`
- `## API / Server Behavior`
- `## UI Composition`
- `## Visual Design Direction`
- `## State, Errors, and Empty States`
- `## Files To Touch`
- `## Files Not To Touch`
- `## Test Strategy`
- `## Prototype Guidance`
- `## Risks And Open Questions`

The design must trace back to user story ids, US mock operations, and `requirements.md` UI design expectations.

## Revision Loop

- If implementation constraints invalidate requirements, route to `/keel-requirements`.
- If design constraints invalidate the user operation flow, route to `/keel-us`.
- If existing UI evidence is insufficient for the requested visual match, record the gap and ask the user for a source or approve a lower-fidelity prototype.

Ask for approval after writing. When approved, set `artifacts.design.status` to `approved`.

## Quality Gate

- Design is specific enough for planning tasks.
- Design identifies existing implementation locations when present.
- Design has explicit file boundaries.
- Visual design direction is grounded in requirements and existing UI evidence, or records what remains unknown.
- Prototype guidance states what the simplified prototype must demonstrate.
- `audit.md` records implementation evidence inspected, design decisions, approval or revision status, and the next command.
- Report changed files and next gate: `/keel-proto`.
