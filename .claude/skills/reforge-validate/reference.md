# Reforge Validate Reference

## Error Codes
- `SPEC_MISSING`: `spec.json` does not exist.
- `INVALID_JSON`: File cannot be parsed.
- `SCHEMA_MISSING_SECTION`: Missing `meta`, `tech`, `entities`, `views`, or `flows`.
- `META_MISSING_FIELD`: Missing `name` or `version`.
- `TECH_MISSING_FIELD`: Missing a required tech stack field.
- `ENTITY_INVALID`: Entity definition is malformed.
- `REF_INTEGRITY_VIEW`: View references an unknown entity.
- `REF_INTEGRITY_FLOW`: Flow references an unknown entity.
- `PENDING_QUESTIONS`: Warning when `questions.json` has pending questions.

## Output Format
Must output a JSON object containing `status` ("valid" or "invalid") and `issues` (an array of issue objects).
Each issue object must contain:
- `code`: string (from above list)
- `severity`: "error" or "warning"
- `jsonPath`: string (e.g. `$.entities.User`)
- `message`: string
- `suggestedFix`: string
