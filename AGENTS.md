# Reforge

AI-DLC Inception and prototype convergence for Claude Code and Codex.

## Commands

| Codex Command | Claude Code Command | Description |
|---|---|---|
| `$reforge-requirements "<idea>"` | `/reforge-requirements "<idea>"` | Create or revise Requirements |
| `$reforge-us` | `/reforge-us` | Create User Stories and US mock operations |
| `$reforge-design` | `/reforge-design` | Create cc-sdd-style implementation Design |
| `$reforge-proto` | `/reforge-proto` | Create and review simplified prototype |
| `$reforge-plan` | `/reforge-plan` | Generate implementation plan |
| `$reforge-impl [task-id]` | `/reforge-impl [task-id]` | Implement one approved plan task |

## Workflow

1. `$reforge-requirements "作りたい体験や機能"` — produce `requirements.md`
2. `$reforge-us` — produce `user-stories.md` and `us-mock.md`
3. `$reforge-design` — produce `design.md` from US and existing implementation evidence
4. `$reforge-proto` — produce `prototype.html` and validate the user-story experience
5. `$reforge-plan` — produce `plan.md`
6. `$reforge-impl` — implement one task at a time using a cc-sdd-style loop

## Workspace Files

Reforge writes feature artifacts to `.reforge/<feature>/`:

| File | Purpose |
|---|---|
| `manifest.json` | Artifact index, status, digest metadata |
| `requirements.md` | AI-DLC Requirements |
| `user-stories.md` | User story set |
| `us-mock.md` | User operations and UI moments |
| `design.md` | Implementation design and file boundaries |
| `prototype.html` | Simplified review prototype |
| `plan.md` | Implementation tasks and notes |

`manifest.json` is not the specification. Approved Markdown/HTML artifacts are the source of truth.
