# Reforge

AI-DLC Inception and prototype convergence for Claude Code and Codex.

## Commands

| Command | Description |
|---|---|
| `/reforge-requirements "<idea>"` | Create or revise Requirements |
| `/reforge-us` | Create User Stories and US mock operations |
| `/reforge-design` | Create cc-sdd-style implementation Design |
| `/reforge-proto` | Create and review simplified prototype |
| `/reforge-plan` | Generate implementation plan |
| `/reforge-impl [task-id]` | Implement one approved plan task |

## Workflow

1. `/reforge-requirements "作りたい体験や機能"`
2. `/reforge-us`
3. `/reforge-design`
4. `/reforge-proto`
5. `/reforge-plan`
6. `/reforge-impl`

Artifacts live in `.reforge/<feature>/`. Approved `requirements.md`, `user-stories.md`, `us-mock.md`, `design.md`, and `prototype.html` form the source of truth for planning and implementation.
