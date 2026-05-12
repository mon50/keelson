# Spec Schema

**Audience:** Advanced users extending Reforge.
**Prerequisites:** None.
**Expected Outcome:** Understand `spec.json`.

`spec.json` is the source of truth for one product spec, feature, or initiative.

```json
{
  "meta": {
    "name": "",
    "version": "0.1.0",
    "lang": "en",
    "approved": false,
    "audience": [],
    "intent": ""
  },
  "requirements": [],
  "context": {
    "mode": "greenfield"
  },
  "tech": {
    "frontend": "",
    "backend": "",
    "database": "",
    "orm": "",
    "styling": "",
    "testing": ""
  },
  "entities": {},
  "views": {},
  "flows": {}
}
```

## Required Sections

- `meta`
- `tech`
- `entities`
- `views`
- `flows`

## Optional Sections

- `requirements` - user-story style requirements from the Inception phase.
- `context` - greenfield or brownfield context.

`context.mode` may be:

- `greenfield` - new app, MVP, or prototype.
- `brownfield` - feature work inside an existing repository.
- `unknown` - Reforge should ask before assuming.

Brownfield context can include repository conventions, affected areas, allowed write areas, protected areas, acceptance criteria, and risks. Missing context should become questions rather than guesses.
