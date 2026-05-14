---
name: reforge-design
description: Produce a cc-sdd-style design from approved requirements and user stories, grounded in existing implementation when present.
allowed-tools: Read, Write, Edit, Glob, Bash, AskUserQuestion
---

# reforge-design

## Purpose

Turn approved requirements, user stories, and US mock operations into a concrete implementation design. This is close to cc-sdd Design, but still belongs before prototype approval.

## Inputs

- `requirements.md`
- `user-stories.md`
- `us-mock.md`
- `manifest.json`

Block unless `artifacts.requirements.status`, `artifacts.userStories.status`, and `artifacts.usMock.status` are `approved`.

## Repository Inspection

When this is a brownfield feature, inspect existing implementation evidence before writing design:

- package and framework config
- routing directories
- component directories
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
- `## State, Errors, and Empty States`
- `## Files To Touch`
- `## Files Not To Touch`
- `## Test Strategy`
- `## Prototype Guidance`
- `## Risks And Open Questions`

The design must trace back to user story ids and US mock operations.

## Revision Loop

- If implementation constraints invalidate requirements, route to `/reforge-requirements`.
- If design constraints invalidate the user operation flow, route to `/reforge-us`.
- If existing UI evidence is insufficient for the requested visual match, record the gap and ask the user for a source or approve a lower-fidelity prototype.

Ask for approval after writing. When approved, set `artifacts.design.status` to `approved`.

## Quality Gate

- Design is specific enough for planning tasks.
- Design identifies existing implementation locations when present.
- Design has explicit file boundaries.
- Prototype guidance states what the simplified prototype must demonstrate.
- Report changed files and next gate: `/reforge-proto`.
