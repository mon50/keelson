# Reforge Workflow Guide

Reforge is now an artifact-first AI-DLC Inception workflow. It no longer uses a legacy `spec.json` lifecycle.

## Phases

1. `/reforge-requirements "<idea>"` creates `requirements.md`.
2. `/reforge-us` creates `user-stories.md` and `us-mock.html`.
3. `/reforge-design` creates `design.md` from approved user stories and existing implementation evidence.
4. `/reforge-proto` creates `prototype.html` to validate the US experience and design direction.
5. `/reforge-plan` creates `plan.md`.
6. `/reforge-impl [task-id]` implements one approved plan task.

## Artifacts

```text
.reforge/<feature>/
  manifest.json
  requirements.md
  user-stories.md
  us-mock.html
  design.md
  prototype.html
  plan.md
```

`manifest.json` stores status and digest metadata. Approved Markdown and HTML files are the source of truth.

## Revision Loops

- Requirements ambiguity found in US, Design, Proto, or Impl: return to `/reforge-requirements`.
- User operation mismatch found in Design or Proto: return to `/reforge-us`.
- Implementation/design mismatch found in Proto or Impl: return to `/reforge-design`.
- Prototype experience mismatch: return to `/reforge-us`.

## Implementation

Implementation follows a cc-sdd-style loop: select one task, inspect code, add or update tests when a matching pattern exists, implement the smallest change, run checks, and record implementation notes in `plan.md`.
