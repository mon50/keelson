# Keelson

<div align="center">

**English** | [日本語](README_ja.md)

[![npm](https://img.shields.io/npm/v/keelson-cli)](https://www.npmjs.com/package/keelson-cli)
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
- **One source of truth.** The approved artifact bundle in `.keelson/features/<feature>/` *is* the specification — not a single JSON file, not the chat history.
- **No drift, no guessing.** Open questions are written into the artifact that owns them and resolved explicitly, never filled in by assumption.
- **Mismatches route home.** When a later phase exposes a problem, Keelson sends you back to the artifact that owns it instead of patching ad hoc.

## Quick Start

```bash
cd your-project
npx keelson-cli install
```

Then start inside Claude Code or Codex with the front door:

```text
/keel-discovery "Add team invitations to this existing SaaS app"
```

`/keel-discovery` clarifies the idea and routes it to one of three tracks:

- a **small change or bug fix** → `/keel-quick`
- a **single feature** → the full flow below
- **multiple features** → the full flow, one feature at a time

Once discovery has routed you to a single feature, the full flow is:

```text
/keel-requirements "<feature>"
/keel-us
/keel-design
/keel-proto
/keel-plan
/keel-impl
```

If you already know the shape of the work, you can skip discovery and call `/keel-quick "<change>"` or `/keel-requirements "<feature>"` directly.

## Quick or Full?

`/keel-discovery` applies this checklist to pick the track. You can use the same table to see in advance where your work will be routed.

| Question | YES → | NO → |
|---|---|---|
| Does it add a new user-facing surface (page, screen, major UI region)? | Full flow | quick still possible |
| Does it introduce a new user operation (a new `US-XXX`)? | Full flow | quick still possible |
| Is there meaningful product ambiguity (decisions still open)? | Full flow | quick still possible |
| Does the work span more than a single feature? | Multiple features (`/keel-discovery` decomposes) | Single feature |

If every UI/operation/ambiguity answer is NO and the scope sits inside one feature, the work routes to `/keel-quick`. Any YES on those three routes to `/keel-requirements`. The authoritative rules live in [`keel-discovery`](.claude/skills/keel-discovery/SKILL.md) — this table is a reading aid.

## Commands

| Command | Track / Role | Purpose |
|---|---|---|
| `/keel-steering` | optional setup | Capture project-wide product, tech, principles (once per repo) |
| `/keel-discovery "<idea>"` | **entry (front door)** | Clarify the idea, pick quick / single feature / multiple features |
| `/keel-quick "<change>"` | quick track | Small change or bug fix in one gated skill |
| `/keel-requirements "<feature>"` | full track | Requirements |
| `/keel-us` | full track | User stories and US mock (`us` = user-stories) |
| `/keel-design` | full track | Implementation design |
| `/keel-proto` | full track | Simplified prototype (`proto` = prototype) |
| `/keel-plan` | full track | Implementation plan |
| `/keel-impl [task-id]` | full track | Implement one approved task (`impl` = implement) |
| `/keel-verify` | gate | Audit implementation against approved artifacts |
| `/keel-status` | anytime | Read-only report of current phase and next command |

## Workflow

The artifact table below shows the full flow once `/keel-discovery` routes a single feature. For a small change, `/keel-discovery` routes you to `/keel-quick` instead.

| Phase | Command | Output |
|---|---|---|
| Requirements | `/keel-requirements "<idea>"` | `01-requirements/requirements.md`, `manifest.json`, `audit.md` |
| User Stories | `/keel-us` | `02-user-stories/user-stories.md`, `02-user-stories/us-mock.html` |
| Design | `/keel-design` | `03-design/design.md` |
| Prototype | `/keel-proto` | `04-prototype/prototype.html` |
| Plan | `/keel-plan` | `05-plan/plan.md` |
| Implement | `/keel-impl [task-id]` | code changes plus `05-plan/plan.md` implementation notes |
| Verify | `/keel-verify` | `verify-report.md` |

Each phase has an approval gate. If a later phase exposes a mismatch, it routes back to the artifact that owns the problem:

- Prototype experience mismatch → `/keel-us`
- Prototype/design mismatch → `/keel-design`
- Requirement ambiguity → `/keel-requirements`
- Implementation ambiguity → the owning earlier phase, not ad hoc guessing

## When You're Stuck

If a phase blocks or a later phase exposes a mismatch, Keelson routes you back to the phase that owns the gap rather than letting the AI patch ad hoc. The three most common cases:

- **A phase blocks with "X is not approved"** → run the phase that owns `X` (for example, `/keel-requirements` when `requirements` is not approved).
- **The prototype experience is wrong** → `/keel-us`. **The prototype contradicts design** → `/keel-design`.
- **You don't know what phase you're in** → `/keel-status` (read-only).

See [Troubleshooting — Blocking and Routing](docs/reference/troubleshooting.md) for the full table of block conditions and mismatch routes.

## Source of Truth

The source of truth is the approved artifact bundle:

```text
.keelson/
  system/
    skills/                            (project-local canonical skills)
  discovery.md                       (workspace-wide, optional)
  steering/                          (workspace-wide, optional)
    product.md
    tech.md
    principles.md
  features/
    <feature>/
      manifest.json                    index: paths, phase status, digests
      audit.md                         continuity log + Resume Point
      verify-report.md                 audit result (after /keel-verify)
      01-requirements/requirements.md
      02-user-stories/user-stories.md
      02-user-stories/us-mock.html
      03-design/design.md
      04-prototype/prototype.html
      04-prototype/prototype-notes.md  (optional)
      05-plan/plan.md
```

Phase-owned files live in numbered subdirectories so each phase groups its own attachments (screenshots, notes, references). Workspace-level files — `manifest.json`, `audit.md`, `verify-report.md` — stay at the feature top because they describe the workspace as a whole.

For a small change handled by `/keel-quick`, the feature workspace stays flat with a single `change.md` at the top.

`manifest.json` is only an index. The approved Markdown/HTML artifacts are the specification. `audit.md` is the continuity log: it records user inputs, decisions, artifact changes, validation results, and a `Resume Point` that tells the next session where to start.

## Supported Agents

| Agent | Command prefix | Status |
|---|---|---|
| Claude Code | `/keel-*` | ✅ Supported |
| Codex | `/keel-*` | ✅ Supported |

`npx keelson-cli install` detects `.claude/` and `.agents/` and installs skills into whichever environments are present.

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
