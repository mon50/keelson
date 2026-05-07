# Reforge

Reforge turns a natural-language product description into a structured spec, a local UI prototype, and an entity-by-entity implementation plan — one question at a time.

[![npm version](https://img.shields.io/npm/v/reforge?logo=npm)](https://www.npmjs.com/package/reforge)
[![license: MIT](https://img.shields.io/badge/license-MIT-green.svg)](./LICENSE)

<div align="center"><sub>
README: <a href="./README.md">English</a> | <a href="./README_ja.md">日本語</a>
</sub></div>

## Are you developing Reforge or using it?

- **Using Reforge in your project** — run `npx reforge install` in your project and follow the Quick Start below.
- **Developing Reforge itself** — you are in the source repository. The `reforge/` directory is the npm package. See `CLAUDE.md` in the parent directory for the development workflow (`kiro-*` commands).

---

## What it is, Why it is useful, Who it is for

Reforge is a **Skill-based Agent Framework**. Instead of acting as a standalone CLI tool, Reforge installs a set of **Agent Skills** into your project. Agent Skills are plain-text instruction files that teach your AI coding agent how to execute each workflow step. Running `npx reforge install` copies them into `.claude/skills/` (Claude Code) or `.agents/skills/` (Codex), which makes the `/reforge-*` slash commands available in your agent session.

**Why it is useful:** It transforms natural language into structured artifacts (spec.json) without guessing, keeping human decision-making central.
**Who it is for:** Developers using Claude Code or Codex who want structured, deterministic workflows.
**Who it is not for:** Non-technical users looking for a fully autonomous "build an app for me" button.

### Before / After Example
- **Description:** "A daily report app"
- **Spec:** structured `spec.json` with entities and views
- **Prototype:** running HTML wireframe at `localhost:4317`
- **Tasks:** deterministic `tasks.json` queue for implementation

Each skill owns one step of the product development lifecycle:

| Phase | Skill | What it does |
|---|---|---|
| Spec | `/reforge-init` | Scaffold `spec.json` and a question queue from your description |
| All phases¹ | `/reforge-resume` | Lifecycle navigator — routes to the right next action at any phase |
| Any phase² | `/reforge-update` | Apply a natural-language change to the spec |
| Any phase² | `/reforge-diff` | Show what changed since the last spec snapshot |
| Spec | `/reforge-validate` | Check `spec.json` for completeness and consistency |
| Prototype | `/reforge-render` | Start a local HTML prototype for human approval |
| Plan | `/reforge-plan` | Generate `tasks.json` from the approved spec |
| Implement | `/reforge-impl` | Implement one entity (DB + API + UI + tests) |
| Verify | `/reforge-verify` | Confirm that the implementation matches the spec |

¹ **All phases** — `reforge-resume` actively navigates every phase gate, from first question to final verify.  
² **Any phase** — optional utilities you can invoke at any point without affecting the main lifecycle flow.

All skills share a single data contract under `.reforge/specs/<name>/`. No skill invents decisions — unknowns become pending questions that a human must answer.

## Quick Start

```bash
cd your-project
npx reforge install
```

Then, in your AI coding agent:

```
/reforge-init "A daily-report app for field teams"
```

Reforge scaffolds `spec.json` and asks its first question. Answer it, then run `/reforge-resume` to continue. At any point — questions, validation, prototype, planning, implementation — `/reforge-resume` tells you exactly what to do next.

### Full workflow at a glance

**Navigator mode** — let `reforge-resume` drive every phase:

```
/reforge-init "description"   # scaffold spec + question queue
/reforge-resume               # repeat until complete — navigates questions → validate → render → plan → impl → verify
```

**Manual mode** — invoke each phase directly (use `reforge-resume` only for answering questions):

```
/reforge-init "description"   # scaffold spec + question queue
/reforge-resume               # answer one pending question per run (repeat until no questions remain)
/reforge-validate             # confirm spec is complete
/reforge-render               # review prototype → approve
/reforge-plan                 # generate implementation tasks
/reforge-impl                 # implement entity by entity
/reforge-verify               # verify against spec
```

### Multiple specs

One project can hold multiple specs — one per feature or initiative:

```
/reforge-init "Daily report app"    # creates .reforge/specs/daily-report/
/reforge-init "Photo albums"        # creates .reforge/specs/photo-albums/

/reforge-resume photo-albums        # navigate a specific spec
/reforge-impl photo-albums User     # implement User entity in photo-albums
```

Spec names are auto-derived from your description (kebab-case slug). When only one spec exists, the name argument can be omitted.

## Supported Environments

| Environment | Skills directory |
|---|---|
| **Claude Code** | `.claude/skills/` |
| **Codex** | `.agents/skills/` |

`reforge install` auto-detects which environment is active and installs to the correct location. If both are present, both are installed.

## Workspace Files

All Reforge state lives under `.reforge/specs/<name>/` in your project. `.reforge/` 配下のパスは変更してはならない — every component depends on the standard paths.

| ファイル | 役割 |
|---|---|
| `.reforge/spec.json` | プロダクト仕様（Single Source of Truth） |
| `.reforge/spec.previous.json` | 直前のspecスナップショット（diff用） |
| `.reforge/questions.json` | 質問キュー（pending / answered） |
| `.reforge/tasks.json` | 実装タスクキュー（entity単位のタスク） |

```
.reforge/
├── server/                  # local prototype renderer (created by /reforge-render)
└── specs/
    └── <name>/              # one directory per spec (auto-named from description)
        ├── spec.json        # Single Source of Truth for the product spec
        ├── spec.previous.json  # previous snapshot, used by /reforge-diff
        ├── questions.json   # pending and answered question queue
        └── tasks.json       # implementation task queue (created by /reforge-plan)
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
  - [Status vs Resume](docs/guides/status-vs-resume.md)
  - [Adopting an Existing Repo](docs/guides/adopt-existing-repo.md)
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

