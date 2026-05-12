# Reforge

Keep AI coding agents from guessing.

Reforge is a spec-first workflow for Claude Code and Codex. It turns vague product intent into an approved spec, local prototype, implementation queue, and verification loop before your AI coding agent starts changing code.

Use it for new MVPs or for feature work inside existing repositories. When something is unclear, Reforge does not invent a decision. It turns the unknown into a question and keeps the answer in the spec.

[![npm version](https://img.shields.io/npm/v/aid-reforge?logo=npm)](https://www.npmjs.com/package/aid-reforge)
[![license: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

<div align="center"><sub>
README: <a href="./README.md">English</a> | <a href="./README_ja.md">日本語</a>
</sub></div>

## Why

AI coding is fast at the start. The hard part is keeping the product, data model, API, UI, tasks, and tests from drifting apart after the first few prompts.

Reforge puts a human approval gate in front of implementation:

- Unknown product decisions become pending questions.
- Answers are stored in `.reforge/specs/<name>/spec.json`.
- The local prototype must be approved before planning.
- Implementation runs entity by entity from `tasks.json`.
- Verification checks the implementation back against the spec.

The point is not to make AI more autonomous. The point is to keep AI from silently choosing requirements, roles, states, fields, or repository boundaries for you.

## Use Cases

| Use case | Pain Reforge targets |
|---|---|
| **Greenfield MVP** | You ask Claude Code or Codex to build an app, but auth, permissions, states, views, and data rules are vague. |
| **Brownfield feature** | You add a feature to an existing repository, but the agent may ignore existing stack, naming, ownership boundaries, tests, or protected areas. |

Brownfield support is feature-scoped. Reforge does not claim to fully reverse engineer a large repository. It records lightweight repository context, change scope, allowed write areas, protected areas, acceptance criteria, and risks when they are explicit or safely detectable. Missing context becomes questions.

## Before / After

**Before**

```
"Build a daily report app"
```

The agent may decide draft behavior, submission rules, supervisor approval, admin screens, notifications, database fields, and API shape on its own.

**After**

Reforge asks for the missing decisions first:

- Who can read submitted reports?
- Are drafts required?
- Can a report be edited after submission?
- Which fields belong to the report entity?
- Which views are required for the MVP?

Those answers become the source of truth before implementation begins.

For an existing repository, the same workflow narrows the change:

- Which feature is being added?
- Which existing areas can be touched?
- Which areas are protected?
- What acceptance criteria must pass?
- Which repo conventions should the implementation follow?

## How It Works

Reforge is a **Skill-based Agent Framework**. `npx aid-reforge install` copies the canonical skills into `.reforge/skills/` and installs lightweight forwarders into `.claude/skills/` for Claude Code or `.agents/skills/` for Codex. The visible `/reforge-*` slash commands read the project-local skill files and follow the same workflow contract.

| Phase | Skill | What it does |
|---|---|---|
| Spec | `/reforge-init` | Scaffold `spec.json` and a question queue from your description |
| All phases¹ | `/reforge-resume` | **Navigator mode** - Q&A + phase routing |
| Spec³ | `/reforge-answer` | **Manual mode** - Q&A only, without phase routing |
| Any phase² | `/reforge-update` | Apply a natural-language change to the spec |
| Any phase² | `/reforge-diff` | Show what changed since the last spec snapshot |
| Spec | `/reforge-validate` | Check `spec.json` for completeness and consistency |
| Prototype | `/reforge-render` | Start a local HTML prototype for human approval |
| Plan | `/reforge-plan` | Generate `tasks.json` from the approved spec |
| Implement | `/reforge-impl` | Implement one entity (DB + API + UI + tests) |
| Verify | `/reforge-verify` | Confirm that the implementation matches the spec |

¹ **All phases** - `reforge-resume` actively navigates every phase gate, from first question to final verify.
² **Any phase** - optional utilities you can invoke at any point without affecting the main lifecycle flow.
³ **Manual mode** - use `reforge-answer` when you want to answer questions without phase routing.

Questions are batched when useful: up to 4 questions can be presented at once, and larger batches are written to `.reforge/specs/<name>/questions.md` for offline answering.

## Quick Start

```bash
cd your-project
npx aid-reforge install
```

Then, in your AI coding agent:

```
/reforge-init "A daily-report app for field teams"
/reforge-resume
```

For an existing repository feature:

```
/reforge-init "Add team invitations to this existing SaaS repo. Follow existing auth, email, and team settings conventions."
/reforge-resume
```

`/reforge-resume` tells you exactly what to do next at every point: answer questions, validate, render, approve, plan, implement, or verify.

### Full Workflow

**Navigator mode** - let `reforge-resume` drive every phase:

```
/reforge-init "description"   # scaffold spec + question queue
/reforge-resume               # repeat until complete
```

**Manual mode** - invoke each phase directly:

```
/reforge-init "description"
/reforge-answer               # repeat until no pending questions remain
/reforge-validate
/reforge-render               # review prototype -> approve
/reforge-plan
/reforge-impl
/reforge-verify
```

### Multiple Specs

One project can hold multiple specs, one per feature or initiative:

```
/reforge-init "Daily report app"    # creates .reforge/specs/daily-report/
/reforge-init "Photo albums"        # creates .reforge/specs/photo-albums/

/reforge-resume photo-albums        # navigate a specific spec
/reforge-impl photo-albums User     # implement User in photo-albums
```

When only one spec exists, the name argument can be omitted.

## Supported Environments

| Environment | Forwarder directory |
|---|---|
| **Claude Code** | `.claude/skills/` |
| **Codex** | `.agents/skills/` |

The canonical project-local skills live in `.reforge/skills/`.

## Workspace Files

All Reforge state lives under `.reforge/specs/<name>/` in your project.

Do not rename or move the `.reforge/` paths listed here. Reforge skills and the renderer rely on these standard locations.

| File | Purpose |
|---|---|
| `.reforge/specs/<name>/spec.json` | Product spec and Single Source of Truth |
| `.reforge/specs/<name>/questions.json` | Pending and answered question queue |
| `.reforge/specs/<name>/questions.md` | Optional large question batch for offline answering |
| `.reforge/specs/<name>/spec.previous.json` | Previous spec snapshot used by `/reforge-diff` |
| `.reforge/specs/<name>/tasks.json` | Implementation task queue created by `/reforge-plan` |
| `.reforge/specs/<name>/tasks.previous.json` | Retired task queue when `/reforge-update` resets approval |

```
.reforge/
├── server/                  # local prototype renderer
├── skills/                  # canonical project-local Reforge skills
└── specs/
    └── <name>/
        ├── spec.json
        ├── questions.json
        ├── questions.md
        ├── spec.previous.json
        ├── tasks.json
        └── tasks.previous.json
```

Add `.reforge/` to `.gitignore` to keep workspace state local, or commit it to share progress across machines.

## Requirements

- Node.js 18 or newer

## Documentation

- **Tutorials & Explanations**
  - [Hello Reforge](docs/tutorials/hello-reforge.md)
  - [Why Reforge?](docs/explanation/why-reforge.md)
- **Guides**
  - [Workflow Guide](docs/guides/workflow-guide.md)
  - [Adopting an Existing Repo](docs/guides/adopt-existing-repo.md)
  - [Status vs Resume](docs/guides/status-vs-resume.md)
  - [Recovery and Rollback](docs/guides/recovery-and-rollback.md)
  - [Reviewing Prototypes](docs/guides/reviewing-prototypes.md)
- **Reference**
  - [CLI and Skills](docs/reference/cli-and-skills.md)
  - [Skill Reference](docs/reference/skill-reference.md)
  - [Spec Schema](docs/reference/spec-schema.md)
  - [Questions Schema](docs/reference/questions-schema.md)
  - [Tasks Schema](docs/reference/tasks-schema.md)
  - [Verify Contract](docs/reference/verify-contract.md)
  - [Support Matrix](docs/reference/support-matrix.md)
  - [Limitations](docs/reference/limitations.md)
  - [Troubleshooting](docs/reference/troubleshooting.md)
- **Languages**
  - [日本語 README](README_ja.md)

## Support & Maturity Policy

**Maturity:** Beta. API and workflow structure may evolve.
**Support Policy:** See [SECURITY.md](SECURITY.md) and [SUPPORT.md](SUPPORT.md).
