# Requirements

## Product Intent
A lightweight daily report app for small teams. Each member submits one short
end-of-day report; managers and teammates browse the team's recent reports to
stay aligned without status meetings.

## Users
- Team member: submits and edits their own daily report.
- Manager: reads the whole team's reports; cannot edit others' reports.

## In Scope
- Submit a daily report: date, what got done, blockers, mood.
- Edit today's own report before the day ends.
- View a feed of the team's reports for the last 14 days, newest first.
- Filter the feed by member.

## Out of Scope
- Notifications and reminders.
- Analytics, charts, or exports.
- Comments or reactions on reports.

## Acceptance Signals
- A member can submit today's report and immediately see it at the top of the feed.
- A member can edit only their own report for the current day.
- A manager sees every member's reports in the 14-day feed.

## UI Design Expectations
- Calm, text-first layout; the report form is the primary surface.
- One report per member per day; today's entry is visually distinguished.
- The feed is a vertical list of cards: member name, date, body, blockers badge.
- Empty state when no reports exist yet; clear loading and error states.
- Responsive single-column layout that works on mobile.

## Constraints
- Must work as a small web app; no native mobile app.
- A report body is at most 1000 characters.

## Open Questions
- None.

## Next Gate
/keel-us
