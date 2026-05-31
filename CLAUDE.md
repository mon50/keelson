# Keelson

AI-DLC Inception and prototype convergence for Claude Code and Codex.

## Commands

| Command | Description |
|---|---|
| `/keel-requirements "<idea>"` | Create or revise Requirements |
| `/keel-us` | Create User Stories and US mock operations (`us` = user-stories) |
| `/keel-design` | Create Kiro-style implementation Design |
| `/keel-proto` | Create and review simplified prototype (`proto` = prototype) |
| `/keel-plan` | Generate implementation plan |
| `/keel-impl [task-id]` | Implement one approved plan task (`impl` = implement) |
| `/keel-status` | Report the current phase and next command (read-only) |
| `/keel-steering` | Create or update project-wide steering (product, tech, principles) |
| `/keel-verify` | Audit the implementation against the approved artifacts |
| `/keel-quick "<change>"` | Lightweight track for a small change or bug fix |
| `/keel-discovery "<idea>"` | Front door: route a rough idea into one or more tracks |

## Workflow

0. `/keel-steering` — optional, run once per repository to capture project-wide product, tech, and principles that every phase reads.
1. `/keel-discovery "<idea>"` — the front door. Clarifies the idea and routes it to the quick track or to the full flow below. Use this for any rough or large idea.
2. `/keel-requirements "作りたい体験や機能"`
3. `/keel-us`
4. `/keel-design`
5. `/keel-proto`
6. `/keel-plan`
7. `/keel-impl`
8. `/keel-verify`

Steps 2–8 are the full flow that runs after `/keel-discovery` routes a single feature. For a small change or bug fix, `/keel-discovery` routes to `/keel-quick` instead of the full flow; you can also call `/keel-quick "<change>"` directly when the shape is obvious.

Run `/keel-status` at any time to report the current phase and the recommended next command (read-only).

Project-local canonical skills live in `.keelson/system/skills/`. Artifacts live in `.keelson/features/<feature>/`. Phase-owned files sit under numbered subdirectories (`01-requirements/requirements.md`, `02-user-stories/{user-stories.md, us-mock.html}`, `03-design/design.md`, `04-prototype/prototype.html`, `05-plan/plan.md`). Workspace-level files (`manifest.json`, `audit.md`, `verify-report.md`) stay at the feature top. Approved artifacts form the source of truth for planning and implementation; `audit.md` records the interaction history, decisions, checks, and the next resume point for the following session. For a `/keel-quick` change the workspace is flat — a single `change.md` at the feature top.
