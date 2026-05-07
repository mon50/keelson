# Reforge Render Examples

## Example 1: Approved
```text
Server started at http://127.0.0.1:4317
Please review the prototype.
Options:
- approve
- reject
- stop
[User says: approve]
Updating spec.json with approval audit trail.
Server stopped.
Next recommended command: reforge-plan
```

## Example 2: Rejected
```text
Server started at http://127.0.0.1:4317
Please review the prototype.
[User says: reject]
Server stopped.
To fix issues, run reforge-update with your requested changes, then reforge-validate, and finally reforge-render again.
```
