# Changelog

All notable changes to this project will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-05-18
### Added
- Keelson Agent Skills for the artifact-first workflow: `/keel-requirements`, `/keel-us`, `/keel-design`, `/keel-proto`, `/keel-plan`, `/keel-impl`.
- Keelson CLI with `install`, `doctor`, and `uninstall` commands.
- Support for Claude Code and Codex environments.
- Bilingual (English / 日本語) workflow and reference documentation.
- CI/CD workflows and automated skill linting.

### Removed
- The unused `keelson-renderer` package and its install wiring.
- Backward-compatibility references to the legacy `spec.json` lifecycle.
