# Questions Schema

**Audience:** Users debugging Reforge flow.
**Prerequisites:** None.
**Expected Outcome:** Understand `questions.json` and optional `questions.md`.

`questions.json` stores decisions that Reforge must not guess.

```json
{
  "pending": [
    {
      "id": "define_intent",
      "phase": "intent",
      "question": "What problem does this product solve?",
      "type": "text",
      "resolves": ["meta.intent"]
    }
  ],
  "answered": []
}
```

## Question Entry

- `id`: stable snake_case identifier.
- `phase`: one of `meta`, `audience`, `intent`, `requirements`, `tech`, `data`, `views`, `flows`, `update`.
- `question`: user-facing question.
- `type`: one of `text`, `single_choice`, `multi_choice`, `multi_input`, `confirm`.
- `resolves`: `spec.json` paths updated by the answer.
- `options`: optional options for choice questions.

## Batching

When there are 1 to 4 pending questions, Reforge can present them as one AskUserQuestion batch.

When there are 5 or more pending questions, Reforge writes `.reforge/specs/<name>/questions.md` so the user can answer offline and resume later.

Unanswered questions remain in `pending`. Answered questions move to `answered` with the captured answer.
