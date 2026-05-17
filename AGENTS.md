# Keelson

AI-DLC Inception and prototype convergence for Claude Code and Codex.

## Commands

| Codex Command | Claude Code Command | Description |
|---|---|---|
| `$keel-requirements "<idea>"` | `/keel-requirements "<idea>"` | Create or revise Requirements |
| `$keel-us` | `/keel-us` | Create User Stories and US mock operations |
| `$keel-design` | `/keel-design` | Create cc-sdd-style implementation Design |
| `$keel-proto` | `/keel-proto` | Create and review simplified prototype |
| `$keel-plan` | `/keel-plan` | Generate implementation plan |
| `$keel-impl [task-id]` | `/keel-impl [task-id]` | Implement one approved plan task |

## Workflow

1. `$keel-requirements "作りたい体験や機能"` — produce `requirements.md`, `manifest.json`, and `audit.md`, including UI design expectations for user-facing work
2. `$keel-us` — produce `user-stories.md` and `us-mock.html`
3. `$keel-design` — produce `design.md` from US and existing implementation evidence
4. `$keel-proto` — produce `prototype.html` and validate the user-story experience
5. `$keel-plan` — produce `plan.md`
6. `$keel-impl` — implement one task at a time using a cc-sdd-style loop

## Workspace Files

Keelson writes feature artifacts to `.keelson/<feature>/`:

| File | Purpose |
|---|---|
| `manifest.json` | Artifact index, status, digest metadata |
| `audit.md` | Chronological interaction log and session resume point |
| `requirements.md` | AI-DLC Requirements |
| `user-stories.md` | User story set |
| `us-mock.html` | Browser-readable user operations and UI moments |
| `design.md` | Implementation design and file boundaries |
| `prototype.html` | Simplified review prototype |
| `plan.md` | Implementation tasks and notes |

`manifest.json` is not the specification. Approved Markdown/HTML artifacts are the source of truth.
`audit.md` is not a phase-gated specification artifact; it records what happened and where the next session should resume.

## Release

Keelson releases are tag-driven. This repository does not currently create GitHub Release objects; pushing a `v*` tag triggers `.github/workflows/release.yml`, which builds and publishes the npm package.

1. Merge the release change to `main` and fast-forward local `main`.
2. Confirm `package.json` has the intended version and `npm view keelson version` still shows the previous version.
3. Run the release checks locally, at minimum `npm run build` and the relevant tests.
4. Create an annotated tag on `main`, for example `git tag -a v0.3.0 -m "v0.3.0"`.
5. Push the tag with `git push origin v0.3.0`.
6. Verify the GitHub Actions `Release` workflow succeeds and `npm view keelson version` reports the new version.
