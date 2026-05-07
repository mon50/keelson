# Reforge Resume Examples

## Example 1: Pending Question
```text
Action: ask_question
There are 3 pending questions. Here is the first one:
[tech_frontend] What frontend framework would you like to use?
```

## Example 2: Recording an Answer
```text
Action: record_answer
Recorded answer for 'tech_frontend' -> "Next.js". Updated spec.json at 'tech.frontend'. Question moved to answered.
Please run reforge-resume again to continue.
```

## Example 3: Recommending Next Command
```text
Action: recommend_command
No pending questions. The spec is valid but not approved.
Recommended command: reforge-render
Reason: You need to review and approve the UI prototype before planning.
```
