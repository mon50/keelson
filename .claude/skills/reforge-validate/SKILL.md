---
name: reforge-validate
description: Validate a Reforge spec from .reforge/spec.json and the optional .reforge/questions.json queue.
disable-model-invocation: true
allowed-tools: Read Glob
---

# Reforge Validate

## Inputs
- Optional spec name: $ARGUMENTS

## Preconditions
- Repository is open
- Reforge workspace may or may not exist

## Read set
- .reforge/specs/<name>/spec.json
- .reforge/specs/<name>/questions.json

## Write set
- None

## Output contract
Return a compiler-like JSON or structured report of all validation issues found.
Do not guess or repair invalid input.

Output format:
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

## Procedure
1. Resolve target spec deterministically.
2. Read `spec.json`. If missing, report fatal error.
3. Check top-level sections (`meta`, `tech`, `entities`, `views`, `flows`).
4. Check `meta.name`, `meta.version`, and `meta.reforgeVersion`.
5. Check `tech` fields (`frontend`, `backend`, `database`, `orm`, `styling`, `testing`).
6. Check `entities` structure (must have `fields`, types must be `string|number|date|enum|text|boolean`).
7. Check reference integrity: entities referenced in `views` and `flows` must exist.
8. Read `questions.json`. If `pending` is not empty, report a warning issue.
9. Collect all issues in one pass. Output the JSON report.

## Additional resources
- reference.md
- examples.md
