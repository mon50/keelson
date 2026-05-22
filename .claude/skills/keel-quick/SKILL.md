---
name: keel-quick
description: Lightweight track for a small, well-understood change or bug fix — capture a change brief, implement, and verify in one gated skill.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion
argument-hint: "\"<change>\""
---

# keel-quick

## Purpose

Handle a small, well-understood change — a bug fix, a copy tweak, a contained
refactor — without the full six-phase flow. keel-quick collapses requirements,
design, plan, and implementation into one gated skill.

Use the full flow (`/keel-requirements`) instead when the change adds a new
user-facing surface, new user operations, or meaningful product ambiguity.

## Inputs

- `.keelson/<feature>/change.md` and `manifest.json` if the change already exists.
- `.keelson/<feature>/audit.md` if present; create it if missing.
- `.keelson/steering/*.md` if present — honor the project's product, tech, and principles.
- lightweight repository evidence for the affected area.

## Flow

1. Resolve `<feature>` (a short slug) from the argument or an existing quick-track `manifest.json`.
2. Write `change.md` — the change brief.
3. Initialize `manifest.json` with `track: "quick"` and a `change` artifact, and create `audit.md`.
4. Ask the user to approve the brief.
5. On approval, set the `change` status to `approved`, then implement the change.
6. Run the project's tests, lint, or build for the affected area.
7. Record the outcome in `change.md` and append an entry to `audit.md`; update `## Resume Point`.

## Change.md Contract

`change.md` lives at the feature workspace top (`.keelson/<feature>/change.md`). Quick track stays flat — no numbered subdirectories — because a small change is a single file by design.

`change.md` must contain:

- `# Change`
- `## Intent` — what changes and why, in a few sentences
- `## Scope` — what is in scope and, explicitly, what is not
- `## Affected Files` — the files expected to change
- `## Acceptance` — how to tell the change is correct
- `## Risks And Open Questions`
- `## Implementation Notes` — filled in after implementation

## Manifest Contract

```json
{
  "version": 1,
  "feature": "feature-slug",
  "track": "quick",
  "currentPhase": "change",
  "change": { "path": "change.md", "phase": "change", "status": "draft" }
}
```

## Escape Hatch

If the change turns out to add a new user-facing surface, new user operations,
or meaningful ambiguity, stop. Do not stretch keel-quick to cover it. Record the
reason in `change.md` and route to `/keel-requirements` for the full flow.

## Boundaries

- Edit only the files listed under `## Affected Files`. Touching anything else is
  an out-of-scope edit — stop and re-confirm the brief instead of widening silently.
- Keep the change minimal and reversible.

## Quality Gate

- Never guess an unknown. Record it under `## Risks And Open Questions` or ask with AskUserQuestion; an unresolved question blocks approval.
- Do not implement before the brief is approved.
- Run the relevant checks, or state explicitly why a check could not be run.
- `audit.md` records the change outcome and the next command.
- Report changed files and checks run, and recommend `/keel-verify` for a larger change or `/keel-status` to confirm state.
