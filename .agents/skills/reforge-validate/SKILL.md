---
name: reforge-validate
description: Validate a Reforge spec, returning a compiler-like structured report of all issues.
---

# Reforge Validate

Use this skill to validate a Reforge spec.

Inputs:
- optional spec name

Read:
- .reforge/specs/<name>/spec.json
- .reforge/specs/<name>/questions.json

Write:
- none

Output:
Return a JSON structured report of all validation issues.

Format:
If valid:
```json
{
  "status": "valid",
  "issues": []
}
```

If invalid:
```json
{
  "status": "invalid",
  "issues": [
    {
      "code": "SCHEMA_MISSING_SECTION",
      "severity": "error",
      "jsonPath": "$.tech",
      "message": "top-level section 'tech' is required",
      "suggestedFix": "Add a 'tech' object to the root of spec.json"
    }
  ]
}
```

Do not guess or fix issues. Only report them.
Check for missing sections, missing tech fields, invalid entities, and broken references.
Check that `meta.name`, `meta.version`, and `meta.reforgeVersion` are present.
If questions.json has pending questions, emit a warning issue.
