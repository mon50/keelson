# Recovery and Rollback

**Symptoms:** Spec got messed up.
**Command:** Use `git checkout .reforge` or copy from `spec.previous.json`.
**Success Signal:** `spec.json` is back to a valid state.
**Common Failure:** `reforge-validate` fails after manual edits.
