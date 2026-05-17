# Phase Navigation

<sub>[← Keelson Docs](../README.md) · [English](../README.md#english) | [日本語](../README.md#日本語)</sub>

**Audience:** Users learning the workflow.
**Symptoms:** Not knowing what to do next.
**Command:** Open `.keelson/<feature>/audit.md`, then load `.keelson/<feature>/manifest.json` and the artifacts named in `Resume Point`.
**Success Signal:** The agent advances exactly one phase or routes back to the owning phase for revision.
**Common Failure:** Trying to continue implementation when an upstream artifact is still `draft` or `needs_revision`.

Keelson uses explicit phase commands:

1. `/keel-requirements "<idea>"`
2. `/keel-us`
3. `/keel-design`
4. `/keel-proto`
5. `/keel-plan`
6. `/keel-impl [task-id]`

`manifest.json` answers artifact status. `audit.md` answers what happened in prior sessions and where to resume next.
