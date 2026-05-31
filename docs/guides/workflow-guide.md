# Keelson Workflow Guide

<sub>[← Keelson Docs](../README.md) · English | [日本語](ja/workflow-guide.md)</sub>

Keelson is an artifact-first AI-DLC Inception workflow.

## Phases

1. `/keel-requirements "<idea>"` creates `01-requirements/requirements.md`, plus `manifest.json` and `audit.md` at the feature top, including UI design expectations for user-facing work.
2. `/keel-us` creates `02-user-stories/user-stories.md` and `02-user-stories/us-mock.html`.
3. `/keel-design` creates `03-design/design.md` from approved user stories and existing implementation evidence.
4. `/keel-proto` creates `04-prototype/prototype.html` (and optional `04-prototype/prototype-notes.md`) to validate the US experience and design direction.
5. `/keel-plan` creates `05-plan/plan.md`.
6. `/keel-impl [task-id]` implements one approved plan task.

## Artifacts

```text
.keelson/features/<feature>/
  manifest.json
  audit.md
  verify-report.md                   (after /keel-verify)
  01-requirements/requirements.md
  02-user-stories/user-stories.md
  02-user-stories/us-mock.html
  03-design/design.md
  04-prototype/prototype.html
  04-prototype/prototype-notes.md    (optional)
  05-plan/plan.md
```

Phase-owned files live in numbered subdirectories so each phase can group its attachments (screenshots, notes, references) alongside the primary artifact. Workspace-level files — `manifest.json`, `audit.md`, `verify-report.md` — stay at the feature top.

`manifest.json` stores status and digest metadata. Approved Markdown and HTML files are the source of truth. `audit.md` records the session history and has a `Resume Point` section for the next session.

For a `/keel-quick` change, the workspace stays flat with `manifest.json`, `audit.md`, and `change.md` at the feature top.

## Revision Loops

- Requirements ambiguity found in US, Design, Proto, or Impl: return to `/keel-requirements`.
- User operation mismatch found in Design or Proto: return to `/keel-us`.
- Implementation/design mismatch found in Proto or Impl: return to `/keel-design`.
- Prototype experience mismatch: return to `/keel-us`.

## Implementation

Implementation follows a Kiro-style loop: select one task, inspect code, add or update tests when a matching pattern exists, implement the smallest change, run checks, and record implementation notes in `05-plan/plan.md`.

## Session Continuity

At the start of a resumed workflow, read `.keelson/features/<feature>/audit.md` first, then load the artifacts named in its `Resume Point`. If `audit.md` is missing in an older workspace, recreate it from `manifest.json` and the current artifacts before advancing.
