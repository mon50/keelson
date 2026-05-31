# Troubleshooting — Blocking and Routing

<sub>[← Keelson Docs](../README.md) · English | [日本語](ja/troubleshooting.md)</sub>

Every Keelson phase has explicit block conditions and explicit routes back to the artifact that owns a gap. The table below maps the situations you will hit to the exact next command. The authoritative rules live in each skill's `SKILL.md`; this page is the consolidated reference.

## Block conditions and the command that resolves them

| Situation | Owning phase | Command to run |
|---|---|---|
| No `.keelson/features/<feature>/` workspace exists yet | (entry) | `/keel-discovery "<idea>"` for a rough or large idea, otherwise `/keel-requirements "<idea>"` |
| `/keel-us` blocks: `artifacts.requirements.status` is not `approved` | requirements | `/keel-requirements` |
| `/keel-design` blocks: `requirements`, `userStories`, or `usMock` is not `approved` | the earliest unapproved one | `/keel-requirements` → `/keel-us` |
| `/keel-proto` blocks: `design` (or any earlier artifact) is not `approved` | the earliest unapproved one | `/keel-design` and predecessors |
| `/keel-plan` blocks: `prototype` (or any earlier artifact) is not `approved` | the earliest unapproved one | `/keel-proto` and predecessors |
| `/keel-impl` blocks: `artifacts.plan.status` is not `approved` | plan | `/keel-plan` |
| `/keel-verify` blocks: `artifacts.plan.status` is not `approved` | plan | `/keel-plan` |

## Mismatch routing (a later phase finds the wrong thing)

| Symptom | Owning phase | Command to run |
|---|---|---|
| User stories or US mock expose an ambiguous or missing requirement | requirements | `/keel-requirements` |
| Design exposes a missing or contradictory user operation | user-stories | `/keel-us` |
| Design exposes a requirement that cannot hold given existing implementation | requirements | `/keel-requirements` |
| Prototype experience is wrong (the user-story flow does not hold together) | user-stories | `/keel-us` |
| Prototype contradicts design (the design direction does not hold up) | design | `/keel-design` |
| Plan would touch a file outside `Files To Touch` or inside `Files Not To Touch` | design | `/keel-design` |
| Implementation needs a file outside `Files To Touch` | design | `/keel-design` (then `/keel-plan`) |
| Implementation hits a missing requirement | requirements | `/keel-requirements` |
| Implementation hits a missing user operation | user-stories | `/keel-us` |
| Implementation hits a missing implementation detail | design | `/keel-design` |
| `/keel-verify` reports a failing or incomplete task | plan | `/keel-impl` |
| `/keel-quick` brief turns out to introduce a new user surface or operation | requirements | record the reason in `change.md`, then `/keel-requirements` |

## When you do not know where you are

| Situation | Command to run |
|---|---|
| You opened the repo and do not know what phase you are in | `/keel-status` (read-only) |
| `manifest.json` and `audit.md` Resume Point disagree | `/keel-status` will surface the conflict; resolve it before running the recommended phase command |
| An older workspace has `manifest.json` but no `audit.md` | run the next phase command for that workspace; it will create `audit.md` |

## Principles behind the routing

- Open questions belong in the artifact that owns them, not in chat. An unresolved question blocks approval for that phase.
- A later phase never patches an upstream gap on its own. It marks the upstream artifact `needs_revision` and routes back.
- `manifest.json` is an index; the approved Markdown/HTML artifacts are the specification. Edit the artifact text, not the manifest.
- `audit.md` is a continuity log. It records what happened; it is not a phase gate.
