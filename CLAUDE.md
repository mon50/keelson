# Keelson

AI-DLC Inception and prototype convergence for Claude Code and Codex.

## Commands

| Command | Description |
|---|---|
| `/keel-requirements "<idea>"` | Create or revise Requirements |
| `/keel-us` | Create User Stories and US mock operations |
| `/keel-design` | Create cc-sdd-style implementation Design |
| `/keel-proto` | Create and review simplified prototype |
| `/keel-plan` | Generate implementation plan |
| `/keel-impl [task-id]` | Implement one approved plan task |

## Workflow

1. `/keel-requirements "作りたい体験や機能"`
2. `/keel-us`
3. `/keel-design`
4. `/keel-proto`
5. `/keel-plan`
6. `/keel-impl`

Artifacts live in `.keelson/<feature>/`. Approved `requirements.md`, `user-stories.md`, `us-mock.html`, `design.md`, and `prototype.html` form the source of truth for planning and implementation. `audit.md` records the interaction history, decisions, checks, and the next resume point for the following session.
