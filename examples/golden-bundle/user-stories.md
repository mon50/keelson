# User Stories

## Story Map

```
Team member                          Manager
  │                                     │
  ├─ US-001 Submit today's report       │
  ├─ US-002 Edit today's own report     │
  └─ US-003 Browse 14-day team feed ────┤  US-003 Browse 14-day team feed
     US-004 Filter the feed by member ──┤  US-004 Filter the feed by member
```

The member's primary loop is write → submit → see it at the top of the feed.
Browsing and filtering are shared by members and managers; only submitting and
editing are member-owned.

## Stories

### US-001 — Submit today's report
- **Role:** Team member
- **Goal:** Submit one daily report for today with what I got done, blockers, and mood.
- **Benefit:** My team knows my status without a meeting.
- **Acceptance criteria:**
  - The form captures date (defaults to today), body, blockers, and mood.
  - After submit, my report appears at the top of the feed immediately.
  - I cannot submit a second report for the same day; the form switches to edit.
  - A body over 1000 characters is rejected with an inline message.

### US-002 — Edit today's own report
- **Role:** Team member
- **Goal:** Change my report for the current day before the day ends.
- **Benefit:** I can correct or add detail without creating a duplicate.
- **Acceptance criteria:**
  - I can edit only my own report, and only for the current day.
  - Saving an edit updates the existing feed card in place.
  - Reports from previous days are read-only.

### US-003 — Browse the 14-day team feed
- **Role:** Team member or Manager
- **Goal:** Read the team's reports for the last 14 days, newest first.
- **Benefit:** I stay aligned on what the team did and where it is blocked.
- **Acceptance criteria:**
  - The feed shows every member's reports for the last 14 days.
  - Each card shows member name, date, body, and a blockers badge when blockers exist.
  - When no reports exist, an empty state is shown instead of a blank list.

### US-004 — Filter the feed by member
- **Role:** Team member or Manager
- **Goal:** Narrow the feed to a single member.
- **Benefit:** I can focus on one person's recent updates.
- **Acceptance criteria:**
  - A member selector filters the feed to the chosen member.
  - Clearing the filter restores the full team feed.
  - A filter that matches no reports shows an empty state.

## Acceptance Criteria

| ID | Criterion |
|---|---|
| AC-1 | A submitted report appears at the top of the feed immediately. |
| AC-2 | Only one report per member per day; a second attempt edits the first. |
| AC-3 | A member can edit only their own current-day report. |
| AC-4 | The feed covers the last 14 days for all members, newest first. |
| AC-5 | Filtering by member narrows the feed; clearing restores it. |
| AC-6 | Empty, loading, and error states are shown, never a blank screen. |

## Requirement Traceability

| Requirement (In Scope / Acceptance Signal) | Covered by |
|---|---|
| Submit a daily report (date, done, blockers, mood) | US-001 |
| Edit today's own report before the day ends | US-002 |
| View a 14-day team feed, newest first | US-003 |
| Filter the feed by member | US-004 |
| Member edits only their own report | US-002 |
| Manager sees every member's reports | US-003 |

All in-scope requirements and acceptance signals are covered.

## Open Issues

- None. The approved requirements were unambiguous for this phase.
