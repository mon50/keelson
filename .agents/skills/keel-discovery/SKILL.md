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
2. Decide the shape:
   - a small, contained change or bug fix -> the quick track
   - one feature -> the full flow
   - several features -> decompose them and order them
3. Write `.keelson/discovery.md`.
4. Recommend the single next command for the first piece of work.

## Discovery.md Contract

`.keelson/discovery.md` must contain:

- `# Discovery`
- `## Idea` — the idea as clarified
- `## Shape` — one of: small change, single feature, multiple features
- `## Features` — for each: a slug, a one-line scope, the recommended track (`full` or `quick`), and dependencies
- `## Suggested Order` — the order to build the features, with the rationale
- `## Open Questions` — anything still unresolved
- `## Next Command` — the single command to start the first piece

## Routing

- a small change or bug fix -> `/keel-quick "<change>"`
- a single feature -> `/keel-requirements "<feature>"`
- multiple features -> `/keel-requirements` for the first feature in `## Suggested Order`

## Quality Gate

- Never guess the decomposition. If feature boundaries or scope are unclear, ask the user with AskUserQuestion.
- Keep each feature small enough for one Keelson run; split anything too large.
- `discovery.md` routes work; it is not itself a feature spec and has no `manifest.json` status.
- Recommend exactly one next command.
