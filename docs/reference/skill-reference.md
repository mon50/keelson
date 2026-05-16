# Skill Reference

| Skill | Phase | Purpose |
|---|---|---|
| `reforge-requirements` | Requirements | Create or revise AI-DLC Requirements, including UI design expectations |
| `reforge-us` | User Stories | Create user stories and US mock operations |
| `reforge-design` | Design | Produce implementation design from stories and existing code evidence |
| `reforge-proto` | Prototype | Create a simplified prototype for experience review |
| `reforge-plan` | Plan | Generate implementation tasks in `plan.md` |
| `reforge-impl` | Implementation | Implement one approved task with a cc-sdd-style loop |

## Phase Gates

- Requirements must be approved before User Stories.
- User Stories and US mock must be approved before Design.
- Design must be approved before Prototype.
- Prototype must be approved before Plan.
- Plan must be approved before Implementation.

Later phases route back to the owning phase when they uncover ambiguity or mismatch.

## Audit Trail

Every skill updates `.reforge/<feature>/audit.md`. The log captures user inputs, key decisions, changed artifacts, checks, and a `Resume Point` showing the next command for a future session.
