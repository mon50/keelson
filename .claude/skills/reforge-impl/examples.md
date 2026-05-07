# Reforge Impl Examples

## Example 1: Successful Implementation
```text
=== Preflight Report ===
Target Spec: default
Target Entity: report
Intended Subtasks: db, api, ui, test
Expected File Categories:
- DB migration (Prisma)
- API endpoint (Next.js)
- UI components (Form, List, Detail)
- Unit tests
========================
[Implementation happens...]
=== Postflight Report ===
Changed files:
- prisma/schema.prisma
- src/app/api/report/route.ts
- src/components/report/ReportForm.tsx
- src/components/report/ReportList.tsx
- src/test/report.test.ts

Task 'report' status transitioned from in_progress to done.
Next recommended command: reforge-impl (to implement the next entity)
=========================
```

## Example 2: No Pending Tasks
```text
All tasks are complete.
Next recommended command: reforge-verify
```
