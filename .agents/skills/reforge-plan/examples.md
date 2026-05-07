# Reforge Plan Examples

## Example 1: Initial Planning
```text
Action: files_written
Generated tasks.json with 2 tasks.
Tasks:
- report (pending)
- user (pending)

Next recommended command: reforge-impl report
```

## Example 2: Blocked by Approval
```text
Action: blocked
The spec is not approved. You must approve the spec before planning.
Next recommended command: reforge-render
```
