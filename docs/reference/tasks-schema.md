# Tasks Schema

**Audience:** Users debugging Reforge execution.
**Prerequisites:** None.
**Expected Outcome:** Understand `tasks.json`.

```json
{
  "tasks": [
    {
      "id": "report",
      "entity": "report",
      "status": "pending",
      "subtasks": ["db", "api", "ui", "test"]
    }
  ]
}
```
