# Keelson Workflow Guide

Keelson is now an artifact-first AI-DLC Inception workflow. It no longer uses a legacy `spec.json` lifecycle.

## Phases

1. `/keel-requirements "<idea>"` creates `requirements.md`, `manifest.json`, and `audit.md`, including UI design expectations for user-facing work.
2. `/keel-us` creates `user-stories.md` and `us-mock.html`.
3. `/keel-design` creates `design.md` from approved user stories and existing implementation evidence.
4. `/keel-proto` creates `prototype.html` to validate the US experience and design direction.
5. `/keel-plan` creates `plan.md`.
6. `/keel-impl [task-id]` implements one approved plan task.

## Artifacts

```text
.keelson/<feature>/
  manifest.json
  audit.md
  requirements.md
  user-stories.md
  us-mock.html
  design.md
  prototype.html
  plan.md
```

`manifest.json` stores status and digest metadata. Approved Markdown and HTML files are the source of truth. `audit.md` records the session history and has a `Resume Point` section for the next session.

## Revision Loops

- Requirements ambiguity found in US, Design, Proto, or Impl: return to `/keel-requirements`.
- User operation mismatch found in Design or Proto: return to `/keel-us`.
- Implementation/design mismatch found in Proto or Impl: return to `/keel-design`.
- Prototype experience mismatch: return to `/keel-us`.

## Implementation

Implementation follows a cc-sdd-style loop: select one task, inspect code, add or update tests when a matching pattern exists, implement the smallest change, run checks, and record implementation notes in `plan.md`.

## Session Continuity

At the start of a resumed workflow, read `.keelson/<feature>/audit.md` first, then load the artifacts named in its `Resume Point`. If `audit.md` is missing in an older workspace, recreate it from `manifest.json` and the current artifacts before advancing.
