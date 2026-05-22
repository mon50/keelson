# Hello Keelson (Quick) Tutorial

<sub>[← Keelson Docs](../README.md) · English | [日本語](ja/hello-keelson-quick.md)</sub>

**Audience:** First-time Keelson users who want to feel the workflow on a small, contained change.
**Prerequisites:** Node.js 18+, Claude Code or Codex installed, a repository you can edit.
**Expected Outcome:** Run the quick track end to end — a change brief, an approved implementation, and a verification — in about five minutes.

For a full feature (new user-facing surface, multiple user operations), see [Hello Keelson (Full)](hello-keelson.md) instead.

## Step 1: Install Keelson

```bash
npx keelson-cli install
```

This installs the `/keel-*` skills into `.claude/skills` and/or `.agents/skills`.

## Step 2: Start at the Front Door

Pick a small, well-understood change in the repository. A good first example is fixing a typo in the project `README.md` — a single edit, no new user operations, no new UI surface.

In your AI agent:

```
/keel-discovery "Fix a typo in README.md (replace 'recieve' with 'receive')"
```

`/keel-discovery` clarifies the idea and applies the Track Decision Checklist:

- No new user-facing surface → ✓
- No new user operation → ✓
- No meaningful product ambiguity → ✓
- Stays within a single file → ✓

All four checks pass, so discovery routes to `/keel-quick` and writes `.keelson/discovery.md`.

## Step 3: Run the Quick Track

```
/keel-quick "Fix README typo: recieve -> receive"
```

`/keel-quick` writes `.keelson/<feature>/change.md` with the change brief: intent, scope, affected files, acceptance, and risks. It then asks you to approve the brief before any code is touched.

Approve the brief in the chat (for example, reply `approved`). `/keel-quick` then:

1. Edits the listed file with the smallest change that satisfies the brief.
2. Runs the project's tests, lint, or build for the affected area.
3. Records the outcome in `change.md` and appends an entry to `audit.md`.

## Step 4: Verify

For a single-file typo fix the quick-track checks are usually enough, and `/keel-quick` will recommend `/keel-status`. For anything larger — or any time you want a recorded audit — run:

```
/keel-verify
```

`/keel-verify` writes `verify-report.md` at the feature workspace top, summarizing what was implemented, which checks ran, and any remaining manual verification.

## What You Just Did

You went from a rough idea to an approved, implemented, and verified change without touching any other phase. The workspace contains:

```
.keelson/<feature>/
  manifest.json        (track: "quick")
  audit.md
  change.md
  verify-report.md     (if you ran /keel-verify)
```

No `01-requirements/`, no `02-user-stories/`, no design or prototype phase — because the change does not need them.

## When to Use the Full Flow Instead

If your next idea adds a new screen, introduces a new user operation, or has open product questions, `/keel-discovery` will route you to `/keel-requirements` instead. Continue with [Hello Keelson (Full)](hello-keelson.md) for that path.
