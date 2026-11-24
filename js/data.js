// ============================================================
// data.js — Single source of truth for all sample data.
// Nothing in this file knows about the UI. A future backend or
// admin interface would replace this module, not the app logic.
// ============================================================

// --- Leave type configuration --------------------------------
// allowance: default annual allowance in working days.
//   null = no fixed allowance (tracked, but never deducted from a balance).
// paid: whether this type counts toward paid leave balances.
// Unpaid Leave is tracked separately and never reduces paid balances.
export const LEAVE_TYPES = {
  annual: {
    id: "annual",
    label: "Annual Leave",
    defaultAllowance: 20,
    paid: true,
  },
  sick: {
    id: "sick",
    label: "Sick Leave",
    defaultAllowance: 10,
    paid: true,
  },
  personal: {
    id: "personal",
    label: "Personal Leave",
    defaultAllowance: 3,
    paid: true,
  },
  unpaid: {
    id: "unpaid",
    label: "Unpaid Leave",
    defaultAllowance: null, // no fixed allowance
    paid: false,
  },
  parental: {
    id: "parental",
    label: "Maternity / Paternity Leave",
    // Configurable example allowance — sample data, not company policy.
    defaultAllowance: 12,
    paid: true,
  },
};

// --- Status configuration -------------------------------------
// approved  -> counts toward used balance
// scheduled -> future approved-plan, shown as "upcoming", not deducted
// pending   -> awaiting decision, no effect on balances
// rejected / cancelled -> no effect on balances
export const LEAVE_STATUSES = {
  approved: { id: "approved", label: "Approved" },
  scheduled: { id: "scheduled", label: "Scheduled" },
  pending: { id: "pending", label: "Pending" },
  rejected: { id: "rejected", label: "Rejected" },
  cancelled: { id: "cancelled", label: "Cancelled" },
};

// --- Employee calendar colours --------------------------------
// One colour per employee, used by the calendar and legend (Stage 4).
export const EMPLOYEE_COLORS = {
  e001: "#2563eb", // blue
  e002: "#0d9488", // teal
  e003: "#d97706", // amber
  e004: "#dc2626", // red
  e005: "#16a34a", // green
};

// --- Employees -------------------------------------------------
// avatar: initials string (rendered as an initials avatar).
// allowances: per-employee overrides so they can differ later.
//   Keys match LEAVE_TYPES ids. All five start on the same values.
export const EMPLOYEES = [
  {
    id: "e001",
    name: "Sarah Mitchell",
    jobTitle: "HR Manager",
    department: "People Operations",
    avatar: "SM",
    color: EMPLOYEE_COLORS.e001,
    allowances: {
      annual: 20,
      sick: 10,
      personal: 3,
      unpaid: null,
      parental: 12,
    },
  },
  {
    id: "e002",
    name: "David Chen",
    jobTitle: "Software Engineer",
    department: "Engineering",
    avatar: "DC",
    color: EMPLOYEE_COLORS.e002,
    allowances: {
      annual: 20,
      sick: 10,
      personal: 3,
      unpaid: null,
      parental: 12,
    },
  },
  {
    id: "e003",
    name: "Amara Okafor",
    jobTitle: "Marketing Specialist",
    department: "Marketing",
    avatar: "AO",
    color: EMPLOYEE_COLORS.e003,
    allowances: {
      annual: 20,
      sick: 10,
      personal: 3,
      unpaid: null,
      parental: 12,
    },
  },
  {
    id: "e004",
    name: "Tom Becker",
    jobTitle: "Sales Representative",
    department: "Sales",
    avatar: "TB",
    color: EMPLOYEE_COLORS.e004,
    allowances: {
      annual: 20,
      sick: 10,
      personal: 3,
      unpaid: null,
      parental: 12,
    },
  },
  {
    id: "e005",
    name: "Priya Sharma",
    jobTitle: "Financial Analyst",
    department: "Finance",
    avatar: "PS",
    color: EMPLOYEE_COLORS.e005,
    allowances: {
      annual: 20,
      sick: 10,
      personal: 3,
      unpaid: null,
      parental: 12,
    },
  },
];

// --- Leave records for 2026 ------------------------------------
// Dates are plain 'YYYY-MM-DD' strings — no Date objects here, so
// there are no timezone surprises when parsing later.
// Records deliberately include:
//   - periods spanning weekends (Fri–Mon), months, and weeks
//   - a weekend-only period (0 working days)
//   - every status at least once
//   - days when multiple employees are off at once
export const LEAVE_RECORDS = [
  // Sarah Mitchell (e001)
  {
    id: "lr-001",
    employeeId: "e001",
    leaveType: "annual",
    startDate: "2026-02-09",
    endDate: "2026-02-13",
    status: "approved",
    note: "Family trip",
  },
  {
    id: "lr-002",
    employeeId: "e001",
    leaveType: "parental",
    startDate: "2026-03-02",
    endDate: "2026-04-10",
    status: "scheduled",
    note: "Parental leave",
  },
  {
    id: "lr-003",
    employeeId: "e001",
    leaveType: "sick",
    startDate: "2026-06-04",
    endDate: "2026-06-05",
    status: "approved",
  },
  {
    id: "lr-004",
    employeeId: "e001",
    leaveType: "personal",
    startDate: "2026-08-14",
    endDate: "2026-08-14",
    status: "approved",
    note: "Moving house",
  },

  // David Chen (e002)
  {
    id: "lr-005",
    employeeId: "e002",
    leaveType: "annual",
    startDate: "2026-01-12",
    endDate: "2026-01-16",
    status: "approved",
    note: "Ski week",
  },
  {
    id: "lr-006",
    employeeId: "e002",
    leaveType: "annual",
    startDate: "2026-07-06",
    endDate: "2026-07-17",
    status: "scheduled",
    note: "Summer holiday",
  },
  {
    id: "lr-007",
    employeeId: "e002",
    leaveType: "sick",
    startDate: "2026-03-23",
    endDate: "2026-03-27",
    status: "approved",
    note: "Flu",
  },
  {
    id: "lr-008",
    employeeId: "e002",
    leaveType: "unpaid",
    startDate: "2026-11-23",
    endDate: "2026-11-25",
    status: "approved",
    note: "Extended travel",
  },

  // Amara Okafor (e003)
  {
    id: "lr-009",
    employeeId: "e003",
    leaveType: "annual",
    startDate: "2026-04-06",
    endDate: "2026-04-09",
    status: "approved",
    note: "Wedding abroad",
  },
  {
    id: "lr-010",
    employeeId: "e003",
    leaveType: "annual",
    startDate: "2026-05-19",
    endDate: "2026-05-22",
    status: "pending",
    note: "Awaiting cover plan",
  },
  {
    id: "lr-011",
    employeeId: "e003",
    leaveType: "sick",
    startDate: "2026-02-02",
    endDate: "2026-02-02",
    status: "approved",
  },
  {
    id: "lr-012",
    employeeId: "e003",
    leaveType: "personal",
    startDate: "2026-07-08",
    endDate: "2026-07-08",
    status: "approved",
    note: "Personal appointment",
  },
  {
    id: "lr-013",
    employeeId: "e003",
    leaveType: "annual",
    startDate: "2026-12-21",
    endDate: "2026-12-30",
    status: "scheduled",
    note: "Year-end break",
  },

  // Tom Becker (e004)
  {
    id: "lr-014",
    employeeId: "e004",
    leaveType: "annual",
    startDate: "2026-02-23",
    endDate: "2026-02-27",
    status: "approved",
  },
  {
    id: "lr-015",
    employeeId: "e004",
    leaveType: "annual",
    startDate: "2026-05-25",
    endDate: "2026-06-01",
    status: "approved",
    note: "Spans month boundary",
  },
  {
    id: "lr-016",
    employeeId: "e004",
    leaveType: "sick",
    startDate: "2026-07-20",
    endDate: "2026-07-21",
    status: "approved",
  },
  {
    id: "lr-017",
    employeeId: "e004",
    leaveType: "annual",
    startDate: "2026-08-03",
    endDate: "2026-08-07",
    status: "rejected",
    note: "Rejected — sales peak week",
  },
  {
    id: "lr-018",
    employeeId: "e004",
    leaveType: "personal",
    startDate: "2026-09-14",
    endDate: "2026-09-18",
    status: "cancelled",
    note: "Cancelled by employee",
  },
  {
    id: "lr-019",
    employeeId: "e004",
    leaveType: "annual",
    startDate: "2026-10-03",
    endDate: "2026-10-04",
    status: "approved",
    note: "Weekend only — 0 working days",
  },

  // Priya Sharma (e005)
  {
    id: "lr-020",
    employeeId: "e005",
    leaveType: "annual",
    startDate: "2026-01-05",
    endDate: "2026-01-09",
    status: "approved",
    note: "New year break",
  },
  {
    id: "lr-021",
    employeeId: "e005",
    leaveType: "parental",
    startDate: "2026-05-04",
    endDate: "2026-06-26",
    status: "scheduled",
    note: "Parental leave",
  },
  {
    id: "lr-022",
    employeeId: "e005",
    leaveType: "annual",
    startDate: "2026-08-10",
    endDate: "2026-08-14",
    status: "approved",
  },
  {
    id: "lr-023",
    employeeId: "e005",
    leaveType: "annual",
    startDate: "2026-11-02",
    endDate: "2026-11-06",
    status: "pending",
  },
];
