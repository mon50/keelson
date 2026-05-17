# Keelson

AI-DLC Inception and prototype convergence for Claude Code and Codex.

```text
   ╭───────────────────────────╮
   ╰─╮ │  │  │  │  │  │  │  │ ╭─╯
     ╰─┴──┴──┴──┴──┴──┴──┴──┴─╯
          K E E L S O N
```

*The keelson is the backbone beam that runs the length of a hull and locks every frame true. Keelson keeps your build true to the approved spec.*

Keelson turns a rough product idea into approved Requirements, User Stories, US mock flows, Design, a simplified Prototype, and an implementation Plan. Implementation then continues task-by-task with a cc-sdd-style `/keel-impl` loop.

Backward compatibility with the old `spec.json` / question queue / entity CRUD workflow is intentionally removed.

## Workflow

| Phase | Command | Output |
|---|---|---|
| Requirements | `/keel-requirements "<idea>"` | `requirements.md`, `manifest.json`, `audit.md` |
| User Stories | `/keel-us` | `user-stories.md`, `us-mock.html` |
| Design | `/keel-design` | `design.md` |
| Prototype | `/keel-proto` | `prototype.html` |
| Plan | `/keel-plan` | `plan.md` |
| Implement | `/keel-impl [task-id]` | code changes plus `plan.md` implementation notes |

Each phase has an approval gate. If a later phase exposes a mismatch, it routes back to the artifact that owns the problem:

- Prototype experience mismatch -> `/keel-us`
- Prototype/design mismatch -> `/keel-design`
- Requirement ambiguity -> `/keel-requirements`
- Implementation ambiguity -> the owning earlier phase, not ad hoc guessing

## Source Of Truth

The source of truth is the approved artifact bundle, not one JSON file:

```text
.keelson/<feature>/
  manifest.json
  audit.md
  requirements.md
  user-stories.md
  us-mock.html
  design.md
  prototype.html
  plan.md
```

`manifest.json` is only an index for paths, phase status, and digests. The approved Markdown/HTML artifacts are the specification. `audit.md` is the continuity log: it records user inputs, decisions, artifact changes, validation results, and a `Resume Point` section that tells the next session where to start.

## Quick Start

```bash
cd your-project
npx keelson install
```

Then run:

```text
/keel-requirements "Add team invitations to this existing SaaS app"
/keel-us
/keel-design
/keel-proto
/keel-plan
/keel-impl
```

## Design Stance

Keelson owns the pre-implementation convergence loop:

- Requirements capture WHAT, WHY, and user-facing UI design expectations.
- User Stories capture user operations and UI moments.
- Design grounds the work in existing implementation and file boundaries.
- Prototype validates whether the US experience and design direction hold together.
- Plan creates implementation tasks.

`/keel-impl` follows a cc-sdd-style loop: one task, inspect code, test intent, implement, verify, record notes.
