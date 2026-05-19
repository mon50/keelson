---
name: keel-discovery
description: The front door — turn a rough or large idea into a routed plan: a small change, one feature, or several features, with a recommended track for each.
allowed-tools: Read, Write, Edit, Glob, Grep, AskUserQuestion
argument-hint: "\"<idea>\""
---

# keel-discovery

## Purpose

The entry point for a rough, vague, or large idea. keel-discovery clarifies the
idea, decides whether it is a small change, one feature, or several features,
and routes each piece to the right Keelson track. It does not create feature
workspaces itself.

## Inputs

- the user's idea (the argument); ask for one if none is given.
- `.keelson/steering/*.md` if present — honor the project's product, tech, and principles.
- existing `.keelson/discovery.md` if present — update it, do not discard prior content.
- lightweight repository evidence when the idea touches an existing app.

## Flow

1. Clarify the idea. Ask the user about anything ambiguous with AskUserQuestion; do not guess.
2. Apply the `## Track Decision Checklist` to decide the shape: small change, single feature, or multiple features. When the boundary is unclear or evidence is weak, present the three tracks to the user with AskUserQuestion rather than picking silently.
3. Write `.keelson/discovery.md`, including the `## Track Decision` rationale.
4. Recommend the single next command for the first piece of work.

## Track Decision Checklist

Pick the **quick track** only when ALL of the following hold; otherwise route to the full flow:

- No new user-facing surface (no new page, screen, or major UI region).
- No new user operation (nothing that would become a new `US-XXX`).
- No meaningful product ambiguity — the change is already well understood by the user.
- The affected area fits one focused edit: bug fix, copy tweak, contained refactor, or small adjustment within an existing surface.

If any item is NO, the work is at least a **single feature** — use the full flow.

Decide **multiple features** when the idea spans more than one user-facing capability, has more than one independent acceptance signal, or would otherwise outgrow a single Keelson run. Decompose into feature slugs and order them by dependency.

Never silently route to `/keel-quick` when a checklist item failed. Record the failing item under `## Track Decision` and route to `/keel-requirements` instead. When the user's intent leaves the track ambiguous, ask with AskUserQuestion offering the three options (quick / single feature / multiple features).

## Discovery.md Contract

`.keelson/discovery.md` must contain:

- `# Discovery`
- `## Idea` — the idea as clarified
- `## Shape` — one of: small change, single feature, multiple features
- `## Track Decision` — which track was chosen and a one-line rationale per relevant checklist item (especially any failing item that ruled out quick)
- `## Features` — for each: a slug, a one-line scope, the recommended track (`full` or `quick`), and dependencies
- `## Suggested Order` — the order to build the features, with the rationale
- `## Open Questions` — anything still unresolved
- `## Next Command` — the single command to start the first piece

## Routing

- a small change or bug fix that passes every item in `## Track Decision Checklist` -> `/keel-quick "<change>"`
- a single feature (anything that fails one or more checklist items but stays inside one feature boundary) -> `/keel-requirements "<feature>"`
- multiple features -> `/keel-requirements` for the first feature in `## Suggested Order`

## Quality Gate

- Never guess the decomposition or the track. If feature boundaries, scope, or the quick/full decision are unclear, ask the user with AskUserQuestion.
- Keep each feature small enough for one Keelson run; split anything too large.
- Record the track decision rationale in `## Track Decision` so the choice survives the session and downstream skills can read it.
- `discovery.md` routes work; it is not itself a feature spec and has no `manifest.json` status.
- Recommend exactly one next command.
