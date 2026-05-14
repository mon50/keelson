# Phase Navigation

**Audience:** Users learning the workflow.
**Symptoms:** Not knowing what to do next.
**Command:** Open `.reforge/<feature>/manifest.json` or run the next phase command shown in the current artifact.
**Success Signal:** The agent advances exactly one phase or routes back to the owning phase for revision.
**Common Failure:** Trying to continue implementation when an upstream artifact is still `draft` or `needs_revision`.

Reforge no longer has a navigator command. The phase commands are explicit:

1. `/reforge-requirements "<idea>"`
2. `/reforge-us`
3. `/reforge-design`
4. `/reforge-proto`
5. `/reforge-plan`
6. `/reforge-impl [task-id]`
