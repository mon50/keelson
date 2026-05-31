---
name: {{SKILL_NAME}}
description: Keelson {{SKILL_COMMAND}} command forwarding to the project-local SSoT skill.
allowed-tools: Read, Bash, Write, Edit, Glob, AskUserQuestion
argument-hint: "{{ARGUMENT_HINT}}"
---

# {{SKILL_NAME}}

Read `.keelson/system/skills/{{SKILL_NAME}}/SKILL.md` from the current project root and follow its instructions exactly.

If the file is missing, tell the user to run `npx keelson-cli install` again.
