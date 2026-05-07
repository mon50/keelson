---
name: reforge-resume
description: Move a Reforge workflow forward by one safe step: ask one question, record one answer, or return one next command.
---

# Reforge Resume

Use this skill only for explicit workflow progression.

Inputs:
- optional spec name

Read:
- .reforge/specs/<name>/spec.json
- .reforge/specs/<name>/questions.json
- .reforge/specs/<name>/tasks.json

Write:
- spec.json and questions.json only when recording an answer

Return exactly one of:
- ask_question
- record_answer
- recommend_command
- complete

Rules:
1. One invocation performs one action only.
2. When recording an answer, write only the JSON paths listed in `resolves`.
3. If no question is pending, return exactly one next command and the reason.
4. Never output a full status dashboard.
5. If the target spec is ambiguous, stop and report ambiguity.
