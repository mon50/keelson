---
name: keel-us
description: Create user stories and US mock flows from approved requirements, mapping each story to operations and prototype-ready UI moments.
allowed-tools: Read, Write, Edit, Glob, AskUserQuestion
---

# keel-us

## Purpose

Convert approved requirements into user stories and a US mock. This phase proves the intended user operations before design and prototype work.

## Inputs

- `.keelson/<feature>/manifest.json`
- `.keelson/<feature>/requirements.md`
- `.keelson/<feature>/audit.md` if present; create it if missing.

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
- prototype implication for `/keel-proto`

### Review Controls

The US mock is a review surface, so each story section must carry inline:

- an **Approve** toggle that visibly marks that story as approved
- a free-text **comment** field for change requests on that story

The page must include a **Copy review feedback** button that collects every
story's approval state and comment into one structured plain-text block and
copies it to the clipboard. The reviewer pastes that block into the chat to
return all feedback at once. Emit the block in exactly this format so the agent
can parse it:

```
US Mock Review — <feature>
US-001 <title>: APPROVED
US-002 <title>: CHANGES — <comment text>
US-003 <title>: PENDING
```

Each line is `<story-id> <title>: <APPROVED|CHANGES|PENDING>` with an optional
` — <comment>` suffix whenever a comment was entered.

### HTML Requirements

- Inline CSS only; do not depend on external assets or packages.
- Inline JavaScript only, scoped to the review controls (approve toggles,
  comment fields, the copy-feedback button). Do not script the scenarios.
- The file must open directly in a browser with no build step.
- Use `<details>` and `<summary>` so scenarios can be collapsed.
- Add navigation links between story sections.

This is not implementation design and not the final prototype. It is the experience contract for `/keel-proto`.

## Revision Loop

If a story exposes an unclear or contradictory requirement:

1. Do not paper over the issue.
2. Mark `artifacts.requirements.status` as `needs_revision`.
3. Record the mismatch in `us-mock.html`.
4. Stop and route back to `/keel-requirements`.

If the stories and US mock are acceptable, ask for approval. When approved, set both `artifacts.userStories.status` and `artifacts.usMock.status` to `approved`.

## Quality Gate

- Every in-scope requirement is covered by at least one user story.
- Never guess to cover a gap in `requirements.md`. Ask the user, or mark `artifacts.requirements.status` as `needs_revision` and route back; unresolved unknowns stay in `## Open Issues`.
- Every user story has a matching US mock operation.
- Every UI-relevant story has a prototype implication.
- UI-relevant stories reflect the `## UI Design Expectations` from `requirements.md`.
- `audit.md` records story coverage decisions, approval or revision status, and the next command.
- Report changed files and next gate: `/keel-design` when approved.
