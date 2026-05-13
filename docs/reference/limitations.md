# Limitations

- Each Reforge lifecycle run targets one spec at a time, though a project can contain multiple specs under `.reforge/specs/`.
- Complex architectural features (like multi-tenant databases) require manual coding.
- Entity relationships are basic.
- Brownfield support is feature-scoped. Reforge records lightweight repository context and constraints; it does not fully reverse engineer a large codebase.
- `/reforge-verify` is conservative. Some acceptance criteria remain manual checks when they cannot be proven by file and field coverage.
