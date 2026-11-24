# Employee Leave Tracker

A lightweight, employee-facing, read-only dashboard for viewing 2026 leave balances, upcoming leave, and a shared leave calendar. Built with plain HTML5, CSS3, and vanilla JavaScript (ES modules). No frameworks, no backend, no authentication.

## Running locally

Any static file server works. Two easy options:

- VS Code: right-click `index.html` → "Open with Live Server".
- Node (already installed here): `npm run dev`, then open the printed URL.

ES modules require serving over HTTP — opening `index.html` directly via `file://` will not load the JavaScript.

## Folder structure

```
index.html          Dashboard shell (semantic containers only)
css/style.css       Design tokens, layout, components, responsive rules
js/data.js          ALL sample data: employees, leave types, allowances,
                    statuses, calendar colours, 2026 leave records
js/calculations.js  Pure functions: date handling, working-day counting,
                    leave balance calculation, upcoming-leave queries
js/calendar.js      Calendar rendering, month navigation, employee filter,
                    legend, date-detail panel
js/app.js           Entry point: renders overview, summary cards, upcoming
                    list; boots the calendar
```

Data lives only in `data.js`. The UI is generated from it — nothing per-employee is hardcoded anywhere else.

## Data structure

**Employee** (`js/data.js`)

```js
{
  id: 'e001',
  name: 'Sarah Mitchell',
  jobTitle: 'HR Manager',
  department: 'People Operations',
  avatar: 'SM',                    // initials for the avatar circle
  color: '#2563eb',                // calendar identity colour
  allowances: { annual: 20, sick: 10, personal: 3, unpaid: null, parental: 12 },
}
```

Allowances are per-employee, so they can differ at any time — change one number.

**Leave record**

```js
{
  id: 'lr-001',
  employeeId: 'e001',
  leaveType: 'annual',             // key from LEAVE_TYPES
  startDate: '2026-02-09',         // plain YYYY-MM-DD strings — no Date objects in data
  endDate: '2026-02-13',
  status: 'approved',              // key from LEAVE_STATUSES
  note: 'Family trip',             // optional
}
```

**Leave types** are configured centrally in `LEAVE_TYPES`. The `paid` flag is what makes Unpaid Leave special: unpaid records count toward that type's "days taken" but never reduce any paid balance. The `parental` allowance is a configurable example value, not presented as a policy.

## How balances are calculated

All balances derive from the leave records — nothing is hardcoded:

1. Only **approved** records add to "days used" (working days, weekends excluded).
2. **Scheduled** records are counted separately and shown as "X more working days scheduled — not yet deducted", so future leave is visible without being deducted twice.
3. **Pending, rejected, and cancelled** records have no effect on any balance (rejected/cancelled ones also never appear on the calendar).
4. `Remaining = allowance − used`. If remaining drops below zero, the card shows a red "over-allocated" warning rather than silently showing a negative number.
5. Unpaid leave is summarised as days taken/scheduled only.

## How the calendar works

- Month grid, Monday-first, with previous/next navigation and a clear month/year heading.
- Each record is expanded onto every date it covers, so multi-week and month-crossing leave renders correctly.
- Each day shows one compact dot per employee (colour = employee identity). Dot style encodes status: solid = approved, outlined = scheduled, faded = pending. More than three employees on one day collapses to a `+N` marker.
- The "Show" dropdown filters between all employees and a single employee; the legend updates with it.
- Click (or keyboard-activate) any date to open the detail panel: who is off, leave type, start/end dates, working days, and status.
- Weekends and empty days are visually muted; today's date is highlighted.

## Adding / modifying employees

Edit `EMPLOYEES` in `js/data.js`. Give the new entry a unique `id`, and add a matching colour in `EMPLOYEE_COLORS`. The selector, overview, cards, and calendar pick it up automatically — no other file needs touching. To remove one, delete the entry and any records referencing its `id`.

## Changing allowances and leave records

- Allowances: edit the `allowances` object on the employee in `js/data.js`.
- Leave records: add/remove/edit entries in `LEAVE_RECORDS`. Dates are `YYYY-MM-DD` strings; `leaveType` and `status` must be keys defined in `LEAVE_TYPES` / `LEAVE_STATUSES`.

## Testing checklist

**Calculations**
- [ ] Fri–Mon leave (e.g. 6–9 Feb 2026) shows 2 working days.
- [ ] Weekend-only leave (3–4 Oct, Tom) shows 0 working days and adds 0 to balances.
- [ ] Month-spanning leave (25 May–1 Jun, Tom) shows 6 working days and appears in both May and June calendar views.
- [ ] Year-end leave (21–30 Dec, Amara) shows 8 working days.
- [ ] Rejected (Tom, Aug) and cancelled (Tom, Sep) records change no balances and never appear on the calendar.
- [ ] Pending records (Amara May, Priya Nov) appear in the detail panel as pending but do not reduce any balance.
- [ ] Scheduled records (Sarah parental, David July, Priya parental, Amara December) appear as "scheduled" without reducing "days remaining".

**Dashboard**
- [ ] Switching employees in the header updates the overview, all five cards, and the upcoming list.
- [ ] Unpaid card (David: 3 days taken) shows no allowance figures and a note about not affecting paid leave.
- [ ] Upcoming list only shows approved/scheduled leave ending today or later, soonest first.

**Calendar**
- [ ] Previous/next navigation crosses month and year boundaries correctly.
- [ ] "All employees" vs a single employee changes both the grid dots and the legend.
- [ ] Clicking a date with multiple employees (e.g. 14 Aug 2026) lists each person with correct details.
- [ ] Clicking the same date again clears the selection.
- [ ] Keyboard: Tab to a date, press Enter/Space — same behaviour as clicking.

**Responsive**
- [ ] Desktop: calendar grid and detail panel sit side by side.
- [ ] Tablet/narrow: detail panel drops below the grid.
- [ ] Mobile: summary cards stack single-column; calendar cells stay tappable; no horizontal scrolling anywhere.
