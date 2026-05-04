---
name: reforge-render
description: Start the local Reforge renderer for .reforge/spec.json.
allowed-tools: Read, Bash
---

# reforge-render

## Core Rule

- Think in English, respond to the user in the language specified by `.reforge/spec.json` when it can be read.
- Do not generate or update Spec.Json.
- Do not call an LLM at runtime for rendering.
- Start only the local confirmation UI server.

## Command Flow

1. Confirm `.reforge/spec.json` exists in the current project.
2. Start the renderer server:
   - Prefer installed projects: `node .reforge/server/index.js`
   - When developing this source repository and the built package exists: `node reforge-renderer/dist/index.js`
3. Show the URL printed by the process to the user.
4. Keep the process running so browser reload notifications can be delivered.

## Failure Handling

- If `.reforge/spec.json` is missing, report that `/reforge:init` must be run first.
- If JSON parsing fails, report the parser error and stop.
- If no renderer entrypoint exists, ask the user to install or build the renderer package before running again.
