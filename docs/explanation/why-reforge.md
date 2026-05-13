# Why Reforge?

**Audience:** Developers and product teams using AI coding agents.
**Prerequisites:** Claude Code or Codex.
**Expected Outcome:** Understand the design philosophy behind Reforge.

AI coding agents are good at starting. They are less reliable when requirements are vague, when a feature crosses DB/API/UI boundaries, or when an existing repository has conventions the agent must not ignore.

Reforge exists to prevent that drift.

## Core Idea

Reforge is not an "autonomous app builder". It is a spec-first workflow that keeps human decisions visible before implementation begins.

When something is unclear, Reforge should not guess:

- Unknown product decisions become questions.
- Answers are stored in `spec.json`.
- A local prototype must be approved before planning.
- `tasks.json` defines implementation work entity by entity.
- `/reforge-verify` checks the implementation back against the spec.

The strongest rule is:

> AI should not silently invent decisions that the product owner has not made.

## Greenfield And Brownfield

Reforge supports two common AI-coding failure modes.

**Greenfield MVP:** You ask an agent to build an app from a short prompt. It may invent roles, states, views, data fields, and edge cases because the request was underspecified.

**Brownfield feature:** You ask an agent to add a feature to an existing repository. It may ignore existing stack, naming conventions, ownership boundaries, tests, or protected areas.

Reforge treats both as the same problem: before code changes, converge the spec and make the remaining unknowns explicit.

Brownfield support is deliberately feature-scoped. Reforge records lightweight repository context and change boundaries for the feature being added. It does not claim to fully reverse engineer a large codebase.

## Design Choices

Reforge uses a question queue because unanswered decisions are safer as visible pending work than as hidden AI assumptions.

Reforge uses `spec.json` because natural-language chat history is hard to diff, validate, approve, and verify against.

Reforge requires prototype approval because UI and workflow mismatches are cheaper to catch before implementation tasks exist.

Reforge implements entity by entity because DB, API, UI, and tests need to stay aligned for each product object.

Reforge verifies after implementation because the spec is only useful if code can be checked against it.

## What Reforge Should Not Do

- It should not guess business rules just to keep moving.
- It should not treat "unknown" as "AI decides".
- It should not widen a brownfield change scope without asking.
- It should not claim a repository is understood when only lightweight signals were inspected.
- It should not let implementation proceed before human approval.

That is the product stance: Reforge is for teams and solo developers who want AI coding speed without giving up explicit product decisions.
