# Reforge

AI-DLC Inception and prototype convergence for Claude Code and Codex.

Reforge turns a rough product idea into approved Requirements, User Stories, US mock flows, Design, a simplified Prototype, and an implementation Plan. Implementation then continues task-by-task with a cc-sdd-style `/reforge-impl` loop.

Backward compatibility with the old `spec.json` / question queue / entity CRUD workflow is intentionally removed.

## Workflow

| Phase | Command | Output |
|---|---|---|
| Requirements | `/reforge-requirements "<idea>"` | `requirements.md`, `manifest.json` |
| User Stories | `/reforge-us` | `user-stories.md`, `us-mock.html` |
| Design | `/reforge-design` | `design.md` |
| Prototype | `/reforge-proto` | `prototype.html` |
| Plan | `/reforge-plan` | `plan.md` |
| Implement | `/reforge-impl [task-id]` | code changes plus `plan.md` implementation notes |

Each phase has an approval gate. If a later phase exposes a mismatch, it routes back to the artifact that owns the problem:

- Prototype experience mismatch -> `/reforge-us`
- Prototype/design mismatch -> `/reforge-design`
- Requirement ambiguity -> `/reforge-requirements`
- Implementation ambiguity -> the owning earlier phase, not ad hoc guessing

## Source Of Truth

The source of truth is the approved artifact bundle, not one JSON file:

```text
.reforge/<feature>/
  manifest.json
  requirements.md
  user-stories.md
  us-mock.html
  design.md
  prototype.html
  plan.md
```

`manifest.json` is only an index for paths, phase status, and digests. The approved Markdown/HTML artifacts are the specification.

## Quick Start

```bash
cd your-project
npx aid-reforge install
```

Then run:

```text
/reforge-requirements "Add team invitations to this existing SaaS app"
/reforge-us
/reforge-design
/reforge-proto
/reforge-plan
/reforge-impl
```

## Design Stance

Reforge owns the pre-implementation convergence loop:

- Requirements capture WHAT, WHY, and user-facing UI design expectations.
- User Stories capture user operations and UI moments.
- Design grounds the work in existing implementation and file boundaries.
- Prototype validates whether the US experience and design direction hold together.
- Plan creates implementation tasks.

`/reforge-impl` follows a cc-sdd-style loop: one task, inspect code, test intent, implement, verify, record notes.
