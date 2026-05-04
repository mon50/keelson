# Reforge

Natural-language product spec converger for Claude Code and Codex.

## Commands

| Codex Command | Claude Code Command | Description |
|---------------|---------------------|-------------|
| `$reforge-init "<description>"` | `/reforge:init "<description>"` | Initialize `.reforge/spec.json` and `.reforge/questions.json` |
| `$reforge-resume` | `/reforge:resume` | Present the next unresolved pending question |
| `$reforge-update "<change>"` | `/reforge:update "<change>"` | Apply a natural-language change to the existing spec |
| `$reforge-diff` | `/reforge:diff` | Show JSON-path differences between the previous and current spec |
| `$reforge-validate` | `/reforge:validate` | Validate `.reforge/spec.json` for completeness and consistency |

## Workflow

1. `$reforge-init "日報アプリを作りたい"` — generate initial spec and question queue
2. Answer the presented question; run `$reforge-resume` to continue
3. Repeat until no pending questions remain
4. `$reforge-validate` — confirm the spec is complete and consistent
5. `$reforge-update "<change>"` — apply further changes at any time
6. `$reforge-diff` — review what changed since the last update

## Workspace Files

Reforge reads and writes to `.reforge/` in your project directory:

| File | Purpose |
|------|---------|
| `.reforge/spec.json` | Current product specification |
| `.reforge/questions.json` | Pending and answered question queue |
| `.reforge/spec.previous.json` | Previous spec snapshot (used by `/reforge:diff`) |

Add `.reforge/` to `.gitignore` to keep workspace state local, or commit it to share session progress across machines.

## Skills Location

- Claude Code: `.claude/skills/reforge-*/SKILL.md`
- Codex: `.agents/skills/reforge-*/SKILL.md`
