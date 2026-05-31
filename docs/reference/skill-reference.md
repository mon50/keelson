# Skill Reference

<sub>[← Keelson Docs](../README.md) · English | [日本語](ja/skill-reference.md)</sub>

| Skill | Phase | Purpose |
|---|---|---|
| `keel-requirements` | Requirements | Create or revise AI-DLC Requirements, including UI design expectations |
| `keel-us` | User Stories | Create user stories and US mock operations |
| `keel-design` | Design | Produce implementation design from stories and existing code evidence |
| `keel-proto` | Prototype | Create a simplified prototype for experience review |
| `keel-plan` | Plan | Generate implementation tasks in `05-plan/plan.md` |
| `keel-impl` | Implementation | Implement one approved task with a Kiro-style loop |

## Phase Gates

- Requirements must be approved before User Stories.
- User Stories and US mock must be approved before Design.
- Design must be approved before Prototype.
- Prototype must be approved before Plan.
- Plan must be approved before Implementation.

Later phases route back to the owning phase when they uncover ambiguity or mismatch.

## Audit Trail

Every skill updates `.keelson/features/<feature>/audit.md`. The log captures user inputs, key decisions, changed artifacts, checks, and a `Resume Point` showing the next command for a future session.
