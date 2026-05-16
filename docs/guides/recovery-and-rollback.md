# Recovery and Rollback

**Symptoms:** An artifact got too broad, contradicted another artifact, or was approved too early.
**Command:** Edit the owning artifact or rerun its phase command.
**Success Signal:** `manifest.json` points to the corrected artifact and downstream artifacts are regenerated when needed.
**Common Failure:** Editing `manifest.json` instead of the artifact text.

The source of truth is the approved artifact bundle:

- `requirements.md`
- `user-stories.md`
- `us-mock.html`
- `design.md`
- `prototype.html`
- `plan.md`

After a rollback or regenerated artifact, append the reason and changed files to `audit.md`, then update its `Resume Point` to the correct next command.

If a downstream phase reveals a product mismatch, return to `/reforge-requirements`. If the mismatch is an operation or UI moment, return to `/reforge-us`. If the mismatch is implementation structure, return to `/reforge-design`.
