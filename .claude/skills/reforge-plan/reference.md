# Reforge Plan Reference

## Deterministic Generation
- Tasks must be sorted alphabetically by `entity` name to ensure stability.
- If `tasks.json` already exists, preserve the state of existing tasks.
- The shape of `tasks.json`:
```json
{
  "task_count": 2,
  "planning_mode": "entity",
  "tasks": [
    {
      "id": "report",
      "entity": "report",
      "status": "pending",
      "subtasks": ["db", "api", "ui", "test"],
      "verify_done": false
    },
    {
      "id": "user",
      "entity": "user",
      "status": "done",
      "subtasks": ["db", "api", "ui", "test"],
      "verify_done": true
    }
  ]
}
```

## Re-evaluation on Spec Change
If the spec for an entity has changed, and its task is marked as "done", you should reset its `status` to "pending" and `verify_done` to false, allowing the implementation to be updated.
