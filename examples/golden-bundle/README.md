# Golden Bundle — example Keelson artifact bundle

This directory is a complete, approved Keelson artifact bundle for a sample
feature: a small **daily report app** for teams. It shows what a finished
`.keelson/<feature>/` workspace looks like after the full workflow.

| File | Phase | Produced by |
|---|---|---|
| `requirements.md` | Requirements | `/keel-requirements` |
| `user-stories.md` | User Stories | `/keel-us` |
| `us-mock.html` | User Stories | `/keel-us` |
| `design.md` | Design | `/keel-design` |
| `prototype.html` | Prototype | `/keel-proto` |
| `plan.md` | Plan | `/keel-plan` |
| `manifest.json` | index | every phase |
| `audit.md` | continuity log | every phase |

Open `us-mock.html` and `prototype.html` directly in a browser. All six
artifacts are `approved` in `manifest.json`; `audit.md` carries the
chronological log and the resume point (`/keel-impl T-001`).

`manifest.json` is only an index — the approved Markdown and HTML artifacts are
the specification.
