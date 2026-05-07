# Reforge Validate Examples

## Example 1: Valid Spec
```json
{
  "status": "valid",
  "issues": []
}
```

## Example 2: Invalid Spec
```json
{
  "status": "invalid",
  "issues": [
    {
      "code": "TECH_MISSING_FIELD",
      "severity": "error",
      "jsonPath": "$.tech.frontend",
      "message": "tech.frontend is required",
      "suggestedFix": "Specify a frontend framework like Next.js"
    },
    {
      "code": "PENDING_QUESTIONS",
      "severity": "warning",
      "jsonPath": "$",
      "message": "1 unresolved question remains",
      "suggestedFix": "Run reforge-resume to answer pending questions"
    }
  ]
}
```
