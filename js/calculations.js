// ============================================================
// calculations.js — reusable date and leave-balance math.
// Pure functions: no DOM, no rendering. Dates go in as
// 'YYYY-MM-DD' strings and are handled in UTC to avoid
// timezone drift.
// ============================================================

import { LEAVE_TYPES, LEAVE_STATUSES } from './data.js';

// --- Date helpers ----------------------------------------------

// Parse 'YYYY-MM-DD' to a Date at noon UTC — noon keeps the date
// stable across timezones and makes day arithmetic exact.
export function parseDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

export function formatDate(dateStr, options = {}) {
  const date = parseDate(dateStr);
  return date.toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    ...options,
  });
}

// Day of week for a 'YYYY-MM-DD' string: 0 = Sunday … 6 = Saturday.
export function getDayOfWeek(dateStr) {
  return parseDate(dateStr).getUTCDay();
}

// --- Working-day calculation ------------------------------------
// Counts Monday–Friday between two dates, inclusive. Supports
// periods spanning weekends, weeks, and months. A set of
// 'YYYY-MM-DD' exclusion dates (e.g. public holidays) can be
// passed later without changing the signature's shape.
export function countWorkingDays(startDateStr, endDateStr, excludedDates = new Set()) {
  const start = parseDate(startDateStr);
  const end = parseDate(endDateStr);

  if (end < start) return 0;

  let workingDays = 0;
  const cursor = new Date(start);

  while (cursor <= end) {
    const day = cursor.getUTCDay();
    const dateKey = toDateKey(cursor);
    if (day !== 0 && day !== 6 && !excludedDates.has(dateKey)) {
      workingDays += 1;
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return workingDays;
}

// Inverse of parseDate: UTC Date -> 'YYYY-MM-DD'.
export function toDateKey(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Every calendar date a record covers, as 'YYYY-MM-DD' strings.
// Used by the calendar to place multi-day records on each day.
export function getDatesInRange(startDateStr, endDateStr) {
  const dates = [];
  const cursor = parseDate(startDateStr);
  const end = parseDate(endDateStr);
  while (cursor <= end) {
    dates.push(toDateKey(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return dates;
}

// --- Leave balances ----------------------------------------------

// All records for one employee, newest start first.
export function getRecordsForEmployee(records, employeeId) {
  return records
    .filter((record) => record.employeeId === employeeId)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

// Balance summary for one employee across every leave type.
// Rules:
//   - approved leave reduces the used balance
//   - scheduled leave is reported separately (not deducted twice)
//   - pending / rejected / cancelled have no effect
//   - unpaid leave has no allowance and never affects paid balances
// Returns a map keyed by leave-type id:
//   { allowance, used, scheduled, remaining, isOverAllocated }
// For unpaid: { allowance: null, used, scheduled, remaining: null }.
export function calculateLeaveBalances(employee, records) {
  const employeeRecords = getRecordsForEmployee(records, employee.id);
  const balances = {};

  for (const type of Object.values(LEAVE_TYPES)) {
    balances[type.id] = {
      allowance: employee.allowances[type.id],
      used: 0,
      scheduled: 0,
      remaining: null,
      isOverAllocated: false,
    };
  }

  for (const record of employeeRecords) {
    const balance = balances[record.leaveType];
    if (!balance) continue;

    const days = countWorkingDays(record.startDate, record.endDate);

    if (record.status === LEAVE_STATUSES.approved.id) {
      balance.used += days;
    } else if (record.status === LEAVE_STATUSES.scheduled.id) {
      balance.scheduled += days;
    }
    // pending / rejected / cancelled: no effect on balances.
  }

  for (const type of Object.values(LEAVE_TYPES)) {
    const balance = balances[type.id];
    if (!type.paid || balance.allowance === null) continue;
    balance.remaining = balance.allowance - balance.used;
    balance.isOverAllocated = balance.remaining < 0;
  }

  return balances;
}

// --- Upcoming leave ------------------------------------------------

// Approved or scheduled records ending today or later, soonest first.
export function getUpcomingLeave(records, employeeId, todayStr) {
  return getRecordsForEmployee(records, employeeId).filter((record) => {
    const isActive =
      record.status === LEAVE_STATUSES.approved.id ||
      record.status === LEAVE_STATUSES.scheduled.id;
    return isActive && record.endDate >= todayStr;
  });
}
