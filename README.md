# Keelson

<div align="center">

**English** | [日本語](README_ja.md)

[![npm](https://img.shields.io/npm/v/@keelson/cli)](https://www.npmjs.com/package/@keelson/cli)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

</div>

```text
   ╭───────────────────────────╮
   ╰─╮ │  │  │  │  │  │  │  │ ╭─╯
     ╰─┴──┴──┴──┴──┴──┴──┴──┴─╯
          K E E L S O N
```

> **AI-DLC Inception and prototype convergence for Claude Code and Codex.**
>
> The keelson is the backbone beam that runs the length of a hull and locks every frame true. Keelson keeps your build true to the approved spec.

Keelson turns a rough product idea into approved **Requirements → User Stories → US mock → Design → Prototype → Plan**, then drives implementation task-by-task with a Kiro-style `/keel-impl` loop. Every phase has an approval gate, so the AI never sails ahead of a decision you have made.

## Why Keelson

- **Approve before you build.** Each phase ends at a human approval gate. Implementation reads only from approved artifacts.
- **One source of truth.** The approved artifact bundle in `.keelson/<feature>/` *is* the specification — not a single JSON file, not the chat history.
- **No drift, no guessing.** Open questions are written into the artifact that owns them and resolved explicitly, never filled in by assumption.
- **Mismatches route home.** When a later phase exposes a problem, Keelson sends you back to the artifact that owns it instead of patching ad hoc.

## Quick Start

```bash
cd your-project
npx @keelson/cli install
```

Then run the workflow inside Claude Code or Codex:

```text
/keel-requirements "Add team invitations to this existing SaaS app"
/keel-us
/keel-design
/keel-proto
/keel-plan
/keel-impl
```

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

- Prototype experience mismatch → `/keel-us`
- Prototype/design mismatch → `/keel-design`
- Requirement ambiguity → `/keel-requirements`
- Implementation ambiguity → the owning earlier phase, not ad hoc guessing

## Source of Truth

The source of truth is the approved artifact bundle:

```text
.keelson/<feature>/
  manifest.json      index: paths, phase status, digests
  audit.md           continuity log + Resume Point
  requirements.md
  user-stories.md
  us-mock.html
  design.md
  prototype.html
  plan.md
```

`manifest.json` is only an index. The approved Markdown/HTML artifacts are the specification. `audit.md` is the continuity log: it records user inputs, decisions, artifact changes, validation results, and a `Resume Point` that tells the next session where to start.

## Supported Agents

| Agent | Command prefix | Status |
|---|---|---|
| Claude Code | `/keel-*` | ✅ Supported |
| Codex | `/keel-*` | ✅ Supported |

`npx @keelson/cli install` detects `.claude/` and `.agents/` and installs skills into whichever environments are present.

## Design Stance

Keelson owns the pre-implementation convergence loop:

- **Requirements** capture WHAT, WHY, and user-facing UI design expectations.
- **User Stories** capture user operations and UI moments.
- **Design** grounds the work in existing implementation and file boundaries.
- **Prototype** validates whether the US experience and design direction hold together.
- **Plan** creates implementation tasks.

`/keel-impl` follows a Kiro-style loop: one task, inspect code, test intent, implement, verify, record notes.

## Documentation

Full guides, reference, and explanations — in **English and 日本語**:

- 📖 **[Documentation index](docs/README.md)** — the bilingual hub for every doc
- English — [Workflow Guide](docs/guides/workflow-guide.md) · [Skill Reference](docs/reference/skill-reference.md) · [Why Keelson?](docs/explanation/why-keelson.md)
- 日本語 — [README (日本語)](README_ja.md) · [ワークフローガイド](docs/guides/ja/workflow-guide.md) · [スキルリファレンス](docs/reference/ja/skill-reference.md)

## License

[MIT](LICENSE)
