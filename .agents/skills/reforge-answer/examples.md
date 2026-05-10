# Reforge Answer Examples

## Example 1: Pending Question
```text
Action: ask_question
[tech_frontend] What frontend framework would you like to use?
```

## Example 2: Recording an Answer
```text
Action: record_answer
Recorded answer for 'tech_frontend' -> "Next.js". Updated spec.json at 'tech.frontend'. Question moved to answered.
Remaining pending: 2
```

## Example 3: No Pending Questions (manual mode)
```text
Action: complete
No pending questions remain. Run the next phase command yourself (reforge-validate / reforge-render / reforge-plan / reforge-impl / reforge-verify), or switch to navigator mode with reforge-resume.
```
