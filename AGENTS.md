# Keelson

AI-DLC Inception and prototype convergence for Claude Code and Codex.

## Commands

| Codex Command | Claude Code Command | Description |
|---|---|---|
| `$keel-requirements "<idea>"` | `/keel-requirements "<idea>"` | Create or revise Requirements |
| `$keel-us` | `/keel-us` | Create User Stories and US mock operations (`us` = user-stories) |
| `$keel-design` | `/keel-design` | Create Kiro-style implementation Design |
| `$keel-proto` | `/keel-proto` | Create and review simplified prototype (`proto` = prototype) |
| `$keel-plan` | `/keel-plan` | Generate implementation plan |
| `$keel-impl [task-id]` | `/keel-impl [task-id]` | Implement one approved plan task (`impl` = implement) |
| `$keel-status` | `/keel-status` | Report the current phase and next command (read-only) |
| `$keel-steering` | `/keel-steering` | Create or update project-wide steering (product, tech, principles) |
| `$keel-verify` | `/keel-verify` | Audit the implementation against the approved artifacts |
| `$keel-quick "<change>"` | `/keel-quick "<change>"` | Lightweight track for a small change or bug fix |
| `$keel-discovery "<idea>"` | `/keel-discovery "<idea>"` | Front door: route a rough idea into one or more tracks |

## Workflow

Start a rough or large idea with `$keel-discovery` (`/keel-discovery`); it routes the work into a small change, one feature, or several before the tracks below.

Optionally run `$keel-steering` (`/keel-steering`) once first to capture project-wide product, tech, and principles that every phase below reads.

1. `$keel-requirements "作りたい体験や機能"` — produce `01-requirements/requirements.md`, plus `manifest.json` and `audit.md` at the feature top, including UI design expectations for user-facing work
2. `$keel-us` — produce `02-user-stories/user-stories.md` and `02-user-stories/us-mock.html`
3. `$keel-design` — produce `03-design/design.md` from US and existing implementation evidence
4. `$keel-proto` — produce `04-prototype/prototype.html` and validate the user-story experience
5. `$keel-plan` — produce `05-plan/plan.md`
6. `$keel-impl` — implement one task at a time using a Kiro-style loop
7. `$keel-verify` — audit the implementation against the approved artifacts once all tasks are done

For a small change or bug fix, use `$keel-quick` (`/keel-quick`) instead of the full flow — it captures a brief, implements, and runs checks in one gated skill.

Run `$keel-status` (`/keel-status`) at any time to report the current phase and the recommended next command. It reads `manifest.json` and `audit.md` only and never changes artifacts.

## Workspace Files

Keelson writes feature artifacts to `.keelson/<feature>/`. Phase-owned files live in numbered subdirectories; workspace-level files (`manifest.json`, `audit.md`, `verify-report.md`) stay at the feature top:

| File | Purpose |
|---|---|
| `manifest.json` | Artifact index, status, digest metadata |
| `audit.md` | Chronological interaction log and session resume point |
| `verify-report.md` | Audit result from `/keel-verify` (after implementation) |
| `01-requirements/requirements.md` | AI-DLC Requirements |
| `02-user-stories/user-stories.md` | User story set |
| `02-user-stories/us-mock.html` | Browser-readable user operations and UI moments |
| `03-design/design.md` | Implementation design and file boundaries |
| `04-prototype/prototype.html` | Simplified review prototype |
| `04-prototype/prototype-notes.md` | Optional prototype review notes |
| `05-plan/plan.md` | Implementation tasks and notes |

Each phase's attachments (screenshots, references, evidence dumps) belong inside that phase's subdirectory. For a `/keel-quick` change, the workspace stays flat: `manifest.json`, `audit.md`, and `change.md` at the feature top.

`manifest.json` is not the specification. Approved Markdown/HTML artifacts are the source of truth.
`audit.md` is not a phase-gated specification artifact; it records what happened and where the next session should resume.

## Release

Keelson releases are tag-driven. This repository does not currently create GitHub Release objects; pushing a `v*` tag triggers `.github/workflows/release.yml`, which builds and publishes the npm package.

1. Merge the release change to `main` and fast-forward local `main`.
2. Confirm `package.json` has the intended version and `npm view keelson-cli version` still shows the previous version.
3. Run the release checks locally, at minimum `npm run build` and the relevant tests.
4. Create an annotated tag on `main`, for example `git tag -a v0.3.0 -m "v0.3.0"`.
5. Push the tag with `git push origin v0.3.0`.
6. Verify the GitHub Actions `Release` workflow succeeds and `npm view keelson-cli version` reports the new version.
