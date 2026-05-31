# Hello Keelson (Full) Tutorial

<sub>[← Keelson Docs](../README.md) · English | [日本語](ja/hello-keelson.md)</sub>

**Audience:** Developers new to Keelson who want to build one full feature end to end.
**Prerequisites:** Node.js 18+, Claude Code or Codex installed.
**Expected Outcome:** You will create approved Inception artifacts, a prototype, an implementation plan, and a verified implementation of one small feature.

For a small change or bug fix, use the shorter [Hello Keelson (Quick)](hello-keelson-quick.md) tutorial instead.

## Step 1: Install Keelson

```bash
npx keelson-cli install
```

## Step 2: Start at the Front Door

Pick a small but real feature — something with one new user-facing surface or one new user operation. A daily report app is a good first example because it has a visible UI but few moving parts.

```
/keel-discovery "Daily Report App — a single-screen app where I log a short daily report and review the last seven days"
```

`/keel-discovery` clarifies the idea, applies the Track Decision Checklist, and writes `.keelson/discovery.md`. Because the idea introduces a new UI surface and new user operations, discovery routes to the full flow.

## Step 3: Requirements

```
/keel-requirements "Daily Report App"
```

Keelson writes `01-requirements/requirements.md` and initializes `manifest.json` and `audit.md` at the feature top. Review the requirements (purpose, users, scope, acceptance signals, UI design expectations). When asked, approve the artifact before moving on.

## Step 4: User Stories and US Mock

```
/keel-us
```

Keelson writes `02-user-stories/user-stories.md` and `02-user-stories/us-mock.html`. Open `us-mock.html` in a browser, review each story's scenario, mark each story Approved or write a Changes comment, then click **Copy review feedback** and paste the block back into the chat. Approve when the stories cover the requirements.

## Step 5: Design

```
/keel-design
```

Keelson writes `03-design/design.md`, grounded in existing implementation evidence and the approved user stories. Review architecture, files to touch, files not to touch, and visual direction. Approve when ready.

## Step 6: Prototype

```
/keel-proto
```

Keelson writes `04-prototype/prototype.html`. Open it in a browser to validate the user-story experience and the design direction. If the experience is wrong, Keelson routes you back to `/keel-us`. If the design is wrong, back to `/keel-design`. Approve when both hold.

## Step 7: Plan

```
/keel-plan
```

Keelson writes `05-plan/plan.md` with a stable list of tasks (`T-001`, `T-002`, …) tracing back to user stories and design. Approve the plan.

## Step 8: Implement

```
/keel-impl T-001
```

Keelson implements one task using the Kiro-style loop: inspect code, add or update tests, implement the smallest change, run checks, and record implementation notes in `05-plan/plan.md`. Repeat with `T-002`, `T-003`, … until the plan is complete.

## Step 9: Verify

```
/keel-verify
```

Once every task is done, `/keel-verify` audits the implementation against the approved artifact bundle: task completion, traceability, cross-artifact consistency, boundary adherence, and the project's checks. It writes `verify-report.md` at the feature top and reports any gaps with the phase that owns them.

## What You Just Did

You routed an idea through `/keel-discovery`, produced six approved artifacts, implemented every plan task, and verified the result. The workspace contains:

```
.keelson/features/<feature>/
  manifest.json
  audit.md
  verify-report.md
  01-requirements/requirements.md
  02-user-stories/user-stories.md
  02-user-stories/us-mock.html
  03-design/design.md
  04-prototype/prototype.html
  05-plan/plan.md
```

Each phase has an approval gate, so the AI never sails ahead of a decision you made. If a later phase exposes a mismatch, Keelson sends you back to the artifact that owns it instead of patching ad hoc.
