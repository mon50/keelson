# Adopting an Existing Repo

**Symptoms:** Have a codebase without Reforge.
**Command:** `npx reforge install` then `/reforge-init "Reverse engineer this app"`.
**Success Signal:** `spec.json` matches your code.
**Common Failure:** Reforge overwriting your custom files during `/reforge-impl`. Always review changes.
