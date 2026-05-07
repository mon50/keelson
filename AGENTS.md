# Reforge

Natural-language product spec converger for Claude Code and Codex.

## Commands

| Codex Command | Claude Code Command | Description |
|---------------|---------------------|-------------|
| `$reforge-init "<description>"` | `/reforge-init "<description>"` | Initialize `.reforge/specs/<name>/spec.json` and `questions.json` |
| `$reforge-resume` | `/reforge-resume` | Lifecycle navigator — routes to the right next action at any phase |
| `$reforge-update "<change>"` | `/reforge-update "<change>"` | Apply a natural-language change to the existing spec |
| `$reforge-diff` | `/reforge-diff` | Show JSON-path differences between the previous and current spec |
| `$reforge-validate` | `/reforge-validate` | Validate `spec.json` for completeness and consistency |
| `$reforge-render` | `/reforge-render` | Start the local prototype server for human approval |
| `$reforge-plan` | `/reforge-plan` | Generate `tasks.json` from the approved spec |
| `$reforge-impl [entity]` | `/reforge-impl [entity]` | Implement one entity end-to-end (DB + API + UI + tests) |
| `$reforge-verify` | `/reforge-verify` | Check implementation against the spec |

## Workflow

1. `$reforge-init "日報アプリを作りたい"` — generate initial spec and question queue
2. Answer the presented question; run `$reforge-resume` to continue
3. Repeat until no pending questions remain
4. `$reforge-validate` — confirm the spec is complete and consistent
5. `$reforge-render` — review UI prototype and approve
6. `$reforge-plan` — generate implementation tasks
7. `$reforge-impl` — implement entity by entity
8. `$reforge-verify` — verify implementation against spec

At any point: `$reforge-update "<change>"` to revise, `$reforge-diff` to review changes.

## Workspace Files

Reforge reads and writes to `.reforge/specs/<name>/` in your project directory:

| File | Purpose |
|------|---------|
| `.reforge/specs/<name>/spec.json` | Current product specification (single source of truth) |
| `.reforge/specs/<name>/questions.json` | Pending and answered question queue |
| `.reforge/specs/<name>/spec.previous.json` | Previous spec snapshot (used by `$reforge-diff`) |
| `.reforge/specs/<name>/tasks.json` | Implementation task queue (created by `$reforge-plan`) |

Add `.reforge/` to `.gitignore` to keep workspace state local, or commit it to share session progress across machines.

## Skills Location

- Claude Code: `.claude/skills/reforge-*/SKILL.md`
- Codex: `.agents/skills/reforge-*/SKILL.md`
