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

### Layout

Pick the prototype layout from what is being mocked, and state the chosen layout
near the top of `prototype.html`:

- **Stacked (vertical)** — the default. Use when the prototype shows feature- or
  component-level UI: individual states, forms, or partial views.
- **Panorama (horizontal)** — use when the prototype mocks whole screens as a
  flow, such as full smartphone screens screen by screen. Place the screens side
  by side in a horizontally scrollable strip, each in a realistic device-width
  frame, so the flow can be compared at a glance.
- **Desktop screens** — full desktop screens are wide; do not force them into a
  narrow panorama strip. Prefer one screen per row, or a small grid, at a
  realistic viewport width.

The layout must stay responsive and open directly in a browser with no build
step. When unsure, prefer stacked and note the reason.

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
