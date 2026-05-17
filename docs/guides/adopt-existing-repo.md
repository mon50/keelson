# Adopting An Existing Repo

**Audience:** Developers adding a feature to an existing codebase with Claude Code or Codex.
**Prerequisites:** Keelson installed in the repository.
**Expected Outcome:** Create feature-scoped artifacts that constrain the agent before implementation.

Use Keelson for brownfield work when you want an AI coding agent to respect the existing repository instead of inventing a new shape for the feature.

## What Brownfield Means

Brownfield mode is feature-scoped. Keelson should not be used as a blanket "reverse engineer this whole app" claim.

It should capture enough context to implement one feature safely:

- existing tech stack and file layout, when safely detectable
- existing conventions that the feature should follow
- affected areas
- allowed write areas
- protected areas
- acceptance criteria
- known risks or open questions

Anything unclear should remain a pending question.

## Start

```bash
npx keelson install
```

Then ask for the feature, not for a full repo rewrite:

```
/keel-requirements "Add team invitations to this existing SaaS repo. Follow existing auth, email, and team settings conventions."
/keel-us
/keel-design
/keel-proto
/keel-plan
```

Good brownfield prompts mention the feature and constraints:

```
/keel-requirements "Add CSV export to the existing admin reports area. Do not touch billing or auth. Use the current table and filter conventions."
```

Avoid vague prompts:

```
/keel-requirements "Reverse engineer this app"
```

That is too broad. It encourages a spec that pretends to understand more than it actually checked.

## What To Confirm

During Requirements and User Stories, make sure these decisions are explicit:

- What feature is being added?
- Which users or roles can use it?
- Which existing screens, APIs, tables, or services are affected?
- Which paths or domains can be edited?
- Which paths or domains are protected?
- What acceptance criteria must be true before the feature is done?
- Which tests or checks should verify it?

Keelson records this in `requirements.md`, `user-stories.md`, `us-mock.html`, and `design.md`. `manifest.json` indexes artifact status only.

## Implementation

After approval, `/keel-impl` reads the approved artifact bundle and `plan.md`.

For brownfield work, the implementation skill must:

- keep generated files inside `Files To Touch`
- avoid `Files Not To Touch`
- follow explicit repository conventions recorded in `design.md`
- report if the requested implementation needs to widen the change scope
- report which acceptance criteria were covered by files or tests

If the implementation would need to touch a protected or out-of-scope area, return to design first:

```
/keel-design
/keel-proto
/keel-plan
```

## Verification

Verification is task-local. `/keel-impl` runs the relevant checks for the selected task, updates `plan.md`, and reports any manual verification that remains.

## Common Failure

**Symptom:** The agent wants to change unrelated parts of the repository.

**Fix:** Add explicit `Files Not To Touch` or narrower `Files To Touch` in `/keel-design`, then re-run `/keel-proto` and `/keel-plan`.

**Symptom:** Keelson cannot infer existing stack or conventions.

**Fix:** Answer the design question explicitly or point Keelson at the relevant files. Keelson should not guess the stack from weak evidence.

**Symptom:** The spec describes the whole product instead of one feature.

**Fix:** Re-run `/keel-requirements` with a feature-scoped description, then rebuild downstream artifacts.
