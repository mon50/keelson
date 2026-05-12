# Adopting An Existing Repo

**Audience:** Developers adding a feature to an existing codebase with Claude Code or Codex.
**Prerequisites:** Reforge installed in the repository.
**Expected Outcome:** Create a feature-scoped spec that constrains the agent before implementation.

Use Reforge for brownfield work when you want an AI coding agent to respect the existing repository instead of inventing a new shape for the feature.

## What Brownfield Means

Brownfield mode is feature-scoped. Reforge should not be used as a blanket "reverse engineer this whole app" claim.

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
npx aid-reforge install
```

Then ask for the feature, not for a full repo rewrite:

```
/reforge-init "Add team invitations to this existing SaaS repo. Follow existing auth, email, and team settings conventions."
/reforge-resume
```

Good brownfield prompts mention the feature and constraints:

```
/reforge-init "Add CSV export to the existing admin reports area. Do not touch billing or auth. Use the current table and filter conventions."
```

Avoid vague prompts:

```
/reforge-init "Reverse engineer this app"
```

That is too broad. It encourages a spec that pretends to understand more than it actually checked.

## What To Confirm

During Q&A, make sure these decisions are explicit:

- What feature is being added?
- Which users or roles can use it?
- Which existing screens, APIs, tables, or services are affected?
- Which paths or domains can be edited?
- Which paths or domains are protected?
- What acceptance criteria must be true before the feature is done?
- Which tests or checks should verify it?

Reforge records this in optional `spec.context` fields when available. Example:

```json
{
  "context": {
    "mode": "brownfield",
    "repository": {
      "existing": true,
      "detectedStack": ["Next.js", "Prisma"],
      "conventions": ["API routes live under src/app/api", "UI components live under src/components"]
    },
    "changeScope": {
      "feature": "team invitations",
      "affectedAreas": ["auth", "teams", "email"],
      "allowedWriteAreas": ["src/app/api/teams", "src/components/teams", "prisma/migrations"],
      "protectedAreas": ["billing", "legacy imports"]
    },
    "acceptanceCriteria": ["Admins can invite a teammate by email", "Existing RBAC rules still gate team settings"],
    "risks": ["Email provider is not identified yet"]
  }
}
```

## Implementation

After approval, `/reforge-impl` reads the approved spec and `tasks.json`.

For brownfield specs, the implementation skill must:

- keep generated files inside `allowedWriteAreas` when specified
- avoid `protectedAreas`
- follow explicit repository conventions from `spec.context.repository.conventions`
- report if the requested implementation needs to widen the change scope
- report which acceptance criteria were covered by files or tests

If the implementation would need to touch a protected or out-of-scope area, update the spec first:

```
/reforge-update "Allow this feature to add a migration under prisma/migrations and a route under src/app/api/teams."
/reforge-resume
```

## Verify

Run:

```
/reforge-verify
```

Verification remains conservative. It checks structural coverage against `spec.entities`, tech-driven file paths, and task completion. For brownfield context, it also reports allowed/protected areas, acceptance criteria, and risks. Acceptance criteria that cannot be proven by file checks remain manual checks.

## Common Failure

**Symptom:** The agent wants to change unrelated parts of the repository.

**Fix:** Add `protectedAreas` or narrow `allowedWriteAreas` through `/reforge-update`, then re-approve and re-plan.

**Symptom:** Reforge cannot infer existing stack or conventions.

**Fix:** Answer the question explicitly. Reforge should not guess the stack from weak evidence.

**Symptom:** The spec describes the whole product instead of one feature.

**Fix:** Re-run `/reforge-init` with a feature-scoped description, or use `/reforge-update` to narrow `context.changeScope.feature`.
