# Design

## Source Artifacts
- `requirements.md` (approved)
- `user-stories.md` (approved) — US-001..US-004
- `us-mock.html` (approved)

## Existing Implementation Evidence
Greenfield feature; there is no existing repository code to follow. This design
introduces a new small web app and is not constrained by prior conventions.

## Architecture
- Single-page web app served at one route, `/`.
- The client renders a report form and a 14-day team feed.
- A thin server exposes a REST API over a reports store.

## Data Model
`Report`: `{ id, memberId, memberName, date, body, blockers, mood }`
- `date` is `YYYY-MM-DD`; `body` is at most 1000 characters; `blockers` is optional.
- Unique constraint: one report per `(memberId, date)`.

## API / Server Behavior
- `POST /api/reports` — create the caller's report for today; `409` if one exists.
- `PUT /api/reports/today` — update the caller's current-day report.
- `GET /api/reports?days=14&member=<id?>` — list reports in the window, newest first.

## UI Composition
- `Header`
- `ReportForm` — states: empty, saving, today's-summary, editing.
- `FeedSection` — `MemberFilter` plus `FeedList` of `FeedCard`; list states: loading, populated, empty.

## Visual Design Direction
Calm, text-first, responsive single column. The report form is the primary
surface; today's entry is visually distinguished. Feed cards carry a blockers
badge. Inherits the `## UI Design Expectations` from `requirements.md`.

## State, Errors, and Empty States
- Form: inline validation error for a body over 1000 characters; a saving state
  disables submit; failures preserve the typed text.
- Feed: a skeleton while loading; an empty state when no reports exist; a
  per-filter empty state when the selected member has no reports.

## Files To Touch
- `src/app/page.tsx`
- `src/components/ReportForm.tsx`
- `src/components/FeedSection.tsx`
- `src/components/FeedCard.tsx`
- `src/lib/report.ts`
- `src/lib/report-store.ts`
- `src/app/api/reports/route.ts`
- `src/app/api/reports/today/route.ts`

## Files Not To Touch
- Authentication and session code.
- Any existing billing or account-settings modules.

## Test Strategy
- Unit: report validation — the 1000-character limit and one-report-per-day.
- API: create / edit / list happy paths and the `409` duplicate case.
- UI: report-form state transitions; feed loading, empty, and filtered states.

## Prototype Guidance
The prototype should statically demonstrate the empty form, the saving state,
the today's-summary state, the editing form, a populated feed, the loading
skeleton, the empty feed, and the feed filtered to one member. No real backend.

## Risks And Open Questions
- None open. Mood values are fixed to Good / Okay / Rough as shown in the prototype.
