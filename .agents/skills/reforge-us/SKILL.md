---
name: reforge-us
description: Create user stories and US mock flows from approved requirements, mapping each story to operations and prototype-ready UI moments.
allowed-tools: Read, Write, Edit, Glob, AskUserQuestion
---

# reforge-us

## Purpose

Convert approved requirements into user stories and a US mock. This phase proves the intended user operations before design and prototype work.

## Inputs

- `.reforge/<feature>/manifest.json`
- `.reforge/<feature>/requirements.md`
- `.reforge/<feature>/audit.md` if present; create it if missing.

Block if `artifacts.requirements.status` is not `approved`.

## Outputs

- `user-stories.md`
- `us-mock.html`
- updated `manifest.json`
- updated `audit.md`

## Continuity

Before writing, read `audit.md` to understand prior decisions and the current `## Resume Point`. Append a user-stories entry for the user input, story decisions, artifact changes, and validation. Update `## Resume Point` before reporting.

## User-Stories Contract

`user-stories.md` must contain:

- `# User Stories`
- `## Story Map`
- `## Stories`
- `## Acceptance Criteria`
- `## Requirement Traceability`
- `## Open Issues`

Every story must have a stable id such as `US-001`, role, goal, benefit, and acceptance criteria.

## US Mock Contract

Output file: `us-mock.html`

`us-mock.html` must translate each user story into a browser-readable scenario mock:

- story id and title as section headings
- entry point: page, route, or state where the story begins
- user action sequence as numbered steps
- expected visible feedback, including success, failure, loading, and empty states when relevant
- data shown or captured, including API call summaries when known
- edge or empty state as a note, callout, or separate panel
- UI design expectations inherited from `requirements.md`
- prototype implication for `/reforge-proto`

HTML requirements:

- Inline CSS only; do not depend on external assets or packages.
- No JavaScript is required; keep it static unless the user explicitly asks for interaction.
- The file must open directly in a browser.
- Use `<details>` and `<summary>` so scenarios can be collapsed.
- Add navigation links between story sections.

This is not implementation design and not the final prototype. It is the experience contract for `/reforge-proto`.

## Revision Loop

If a story exposes an unclear or contradictory requirement:

1. Do not paper over the issue.
2. Mark `artifacts.requirements.status` as `needs_revision`.
3. Record the mismatch in `us-mock.html`.
4. Stop and route back to `/reforge-requirements`.

If the stories and US mock are acceptable, ask for approval. When approved, set both `artifacts.userStories.status` and `artifacts.usMock.status` to `approved`.

## Quality Gate

- Every in-scope requirement is covered by at least one user story.
- Every user story has a matching US mock operation.
- Every UI-relevant story has a prototype implication.
- UI-relevant stories reflect the `## UI Design Expectations` from `requirements.md`.
- `audit.md` records story coverage decisions, approval or revision status, and the next command.
- Report changed files and next gate: `/reforge-design` when approved.
