---
name: keel-steering
description: Create or update project-wide steering (product, tech, principles) that every Keelson phase reads. Run it once per repository, before feature work.
allowed-tools: Read, Write, Edit, Glob, Bash, AskUserQuestion
---

# keel-steering

## Purpose

Capture project-wide knowledge once so every Keelson phase reads it instead of
re-deriving it. Steering is shared by all features; it is not feature-scoped.

## Inputs

- Existing `.keelson/steering/*.md` if present — update in place; never discard user edits.
- Lightweight repository evidence: package and config files, framework, directory layout, test setup, lint and format config, README.

## Outputs

- `.keelson/steering/product.md`
- `.keelson/steering/tech.md`
- `.keelson/steering/principles.md`

These files are project-wide. They are not phase-gated and carry no approval status in `manifest.json`.

## Steering Contract

### product.md
- what the product is and the problem it solves
- who the users are
- domain language and glossary terms reused across features
- product-wide constraints that are not specific to one feature

### tech.md
- languages, frameworks, and key libraries actually in use
- exact commands to build, test, and lint the project
- naming, file-layout, and code-style conventions
- integration points (auth, database, external services) features must respect

### principles.md
- non-negotiable rules every phase and every task must honor
- for example: test-coverage expectations, accessibility level, public-API stability, security and secret-handling rules, areas that must never be touched
- keep each principle short, checkable, and stated as a rule

## Flow

1. Detect whether `.keelson/steering/` exists. If it does, read it and update; never silently overwrite user edits.
2. Inspect lightweight repository evidence. Do not claim full repository understanding.
3. Draft `product.md`, `tech.md`, and `principles.md` from the evidence.
4. Mark anything uncertain as a question and ask the user with AskUserQuestion rather than guessing.
5. Confirm the drafts with the user before finalizing.

## Quality Gate

- Never guess the stack, conventions, or rules from weak evidence; ask the user.
- Keep steering project-wide. Feature-specific detail belongs in `requirements.md`, not steering.
- Steering is advisory context, not an approval gate; a feature can still start without it.
- Report the steering files written and recommend `/keel-requirements` as the next step.
