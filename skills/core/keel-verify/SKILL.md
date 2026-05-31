---
name: keel-verify
description: Audit the implementation against the approved artifact bundle — task completion, traceability, cross-artifact consistency, and checks — and report gaps.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash, AskUserQuestion
---

# keel-verify

## Purpose

Audit a feature's implementation against its approved artifact bundle and report
whether the artifacts, the plan, and the code still agree. This is the
end-of-workflow gate. It never writes implementation code.

## Inputs

- `01-requirements/requirements.md`, `02-user-stories/user-stories.md`, `02-user-stories/us-mock.html`, `03-design/design.md`, `04-prototype/prototype.html`, `05-plan/plan.md`
- `manifest.json`, `audit.md` (workspace top)
- `.keelson/steering/*.md` if present — honor the project's product, tech, and principles.
- the repository's implemented code and tests

Resolve every artifact path via `manifest.json.artifacts.*.path` rather than hardcoding bare filenames.

Block unless `artifacts.plan.status` is `approved`; there is nothing to verify without an approved plan.

Read `audit.md` first to recover prior decisions and the current `## Resume Point`.

## What keel-verify checks

- **Task completion** — every task in `05-plan/plan.md` is marked done with implementation notes.
- **Traceability** — every in-scope requirement and user story traces forward to a plan task and to changed files or tests.
- **Cross-artifact consistency** — requirements, user stories, design, and plan do not contradict each other or the code.
- **Boundary adherence** — changed files stayed within `03-design/design.md` `## Files To Touch` and avoided `## Files Not To Touch`.
- **Checks** — run the project's tests, lint, and build when a command is known from steering `tech.md` or `03-design/design.md`; record pass, fail, or skipped.

## Guarantee Boundaries

keel-verify checks structural conformance, coverage, task completion, and the
checks it can run. It does NOT guarantee business correctness, UX quality,
security, or acceptance criteria that need human judgment. State this in the report.

## Outputs

- `verify-report.md` at the feature workspace top (`.keelson/features/<feature>/verify-report.md`) — the audit result. Kept at the top alongside `manifest.json` and `audit.md` because it summarizes the whole feature, not a single phase.
- updated `audit.md` (workspace top) — append a verification entry and update `## Resume Point`.

`verify-report.md` is a support file like `audit.md`. It is not a phase-gated artifact and has no `manifest.json` status.

## Verify-Report Contract

`verify-report.md` must contain:

- `# Verification Report`
- `## Summary` — overall result (pass or gaps-found) and the guarantee-boundary note
- `## Task Completion`
- `## Traceability` — requirement / user story -> plan task -> files or tests
- `## Cross-Artifact Consistency`
- `## Checks Run` — commands, pass / fail / skipped, with reasons
- `## Gaps And Routing` — each gap with the phase that owns it

## Routing

For each gap, route to the owning phase rather than guessing a fix:

- incomplete or failing task -> `/keel-impl`
- missing or contradictory implementation detail -> `/keel-design`
- missing user operation -> `/keel-us`
- missing or ambiguous requirement -> `/keel-requirements`

## Quality Gate

- Never edit implementation code or the approved artifacts; keel-verify only reads, runs checks, and writes `verify-report.md` and `audit.md`.
- Never guess that a check passed. If a check could not be run, mark it skipped and say why.
- Report every gap with its owning phase; do not silently pass over a gap.
- Report the verification result and the recommended next command.
