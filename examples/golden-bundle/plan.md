# Implementation Plan

## Source Artifacts
- `requirements.md` (approved)
- `user-stories.md` (approved) — US-001..US-004
- `us-mock.html` (approved)
- `design.md` (approved)
- `prototype.html` (approved)

## Task List
- [ ] T-001 — Report data model and validation
- [ ] T-002 — Reports API: create, edit, list
- [ ] T-003 — Report form with submit, edit, and states
- [ ] T-004 — Team feed with member filter and states

## Task Details

### T-001 — Report data model and validation
- Source: `requirements.md` In Scope; US-001, US-002
- Design: `## Data Model`
- Files likely to change: `src/lib/report.ts`
- Steps: define the `Report` type; implement body-length (<=1000) and one-report-per-`(memberId, date)` validation.
- Tests: unit tests for the 1000-character limit and the one-report-per-day rule.
- Acceptance: AC-2; a body over 1000 characters is rejected.
- Dependencies: none

### T-002 — Reports API: create, edit, list
- Source: US-001, US-002, US-003, US-004
- Design: `## API / Server Behavior`
- Files likely to change: `src/lib/report-store.ts`, `src/app/api/reports/route.ts`, `src/app/api/reports/today/route.ts`
- Steps: implement `POST /api/reports` (409 on duplicate), `PUT /api/reports/today`, and `GET /api/reports?days=14&member=`.
- Tests: API tests for create / edit / list happy paths and the 409 duplicate case.
- Acceptance: AC-1, AC-2, AC-3, AC-4, AC-5
- Dependencies: T-001

### T-003 — Report form with submit, edit, and states
- Source: US-001, US-002
- Design: `## UI Composition` (`ReportForm`)
- Files likely to change: `src/app/page.tsx`, `src/components/ReportForm.tsx`
- Steps: build `ReportForm` with empty / saving / today's-summary / editing states; wire submit and edit to the API.
- Tests: UI tests for the form state transitions.
- Acceptance: AC-1, AC-2, AC-3, AC-6
- Dependencies: T-002

### T-004 — Team feed with member filter and states
- Source: US-003, US-004
- Design: `## UI Composition` (`FeedSection`)
- Files likely to change: `src/components/FeedSection.tsx`, `src/components/FeedCard.tsx`
- Steps: build the 14-day feed list, the member filter, and the loading / populated / empty states.
- Tests: UI tests for feed loading, empty, and filtered states.
- Acceptance: AC-4, AC-5, AC-6
- Dependencies: T-002

## Test Plan
- Unit: report validation (T-001).
- API: reports endpoints including the 409 duplicate (T-002).
- UI: report-form transitions (T-003) and feed states (T-004).

## Review Gates
- Tasks are implemented and verified one at a time via `/keel-impl`.
- A task is done only when its tests pass and its acceptance criteria are covered.

## Out Of Scope
- Notifications, analytics, exports, and comments/reactions — see `requirements.md` Out of Scope.
