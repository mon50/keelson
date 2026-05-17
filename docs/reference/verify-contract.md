# Implementation Verification Contract

**Audience:** Users understanding verification boundaries.
**Prerequisites:** None.
**Expected Outcome:** Know what `/keel-impl` must verify for each task.

- **Guarantees:** Task-local checks are run when available, touched files are reported, and `plan.md` records task status and implementation notes.
- **Reports:** Source artifact traceability, file boundary adherence, test commands, failed or skipped checks, and manual verification that remains.
- **Does Not Guarantee:** Business correctness, UX quality, security, or acceptance criteria that require human review.
