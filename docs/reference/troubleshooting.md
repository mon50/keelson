# Troubleshooting

- **Not sure what to do next.** Run `/reforge-resume` — the navigator prints a phase map plus the single NextAction.
- **Error: `spec.json` not found.** Run `/reforge-init`.
- **Error: `meta.approved` is false.** Run `/reforge-render` and approve. (After `reforge-update`, `meta.approved` is reset automatically; let `/reforge-resume` route you to render.)
- **`tasks.json` exists but seems stale after `reforge-update`.** It does not — `reforge-update` retires the old `tasks.json` to `tasks.previous.json` so `/reforge-resume` will route you back to `/reforge-plan` after re-approval.
- **Error: `Reforge skills were not uninstalled properly.`** Run `npx aid-reforge uninstall`.
