// ============================================================
// app.js — Application entry point: wires data to the UI.
// Reads data.js, computes balances via calculations.js,
// renders the dashboard, and boots the calendar module.
// ============================================================

import { EMPLOYEES, LEAVE_TYPES, LEAVE_STATUSES, LEAVE_RECORDS } from './data.js';
import {
  calculateLeaveBalances,
  getUpcomingLeave,
  countWorkingDays,
} from './calculations.js';
import { createCalendar } from './calendar.js';

// Demo reference date: fixed so the prototype behaves the same
// every day. Records ending before this date are past.
const TODAY = '2026-07-01';

const state = {
  selectedEmployeeId: EMPLOYEES[0].id,
};

const els = {
  employeeSelect: document.getElementById('employee-select'),
  overview: document.getElementById('overview-section'),
  summaryGrid: document.getElementById('summary-grid'),
  upcomingList: document.getElementById('upcoming-list'),
  calendarFilter: document.querySelector('[data-calendar-filter]'),
};

function getSelectedEmployee() {
  return EMPLOYEES.find((e) => e.id === state.selectedEmployeeId);
}

// --- Header employee selector ---------------------------------
function renderEmployeeOptions() {
  els.employeeSelect.innerHTML = '';
  for (const employee of EMPLOYEES) {
    const option = document.createElement('option');
    option.value = employee.id;
    option.textContent = `${employee.name} — ${employee.department}`;
    els.employeeSelect.appendChild(option);
  }
  els.employeeSelect.value = state.selectedEmployeeId;
}

// --- B: Employee overview -------------------------------------
function renderOverview(employee) {
  els.overview.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'overview-card';

  const avatar = document.createElement('div');
  avatar.className = 'avatar';
  avatar.style.background = employee.color;
  avatar.textContent = employee.avatar;
  avatar.setAttribute('aria-hidden', 'true');

  const info = document.createElement('div');
  const name = document.createElement('div');
  name.className = 'overview-name';
  name.textContent = employee.name;
  const role = document.createElement('div');
  role.className = 'overview-role';
  role.textContent = `${employee.jobTitle} · ${employee.department}`;
  info.append(name, role);

  const meta = document.createElement('div');
  meta.className = 'overview-meta';
  const metaItems = [
    { label: 'Employee ID', value: employee.id.toUpperCase() },
    { label: 'Leave year', value: '2026' },
  ];
  for (const item of metaItems) {
    const wrap = document.createElement('div');
    wrap.className = 'meta-item';
    const label = document.createElement('div');
    label.className = 'meta-label';
    label.textContent = item.label;
    const value = document.createElement('div');
    value.className = 'meta-value';
    value.textContent = item.value;
    wrap.append(label, value);
    meta.appendChild(wrap);
  }

  card.append(avatar, info, meta);
  els.overview.appendChild(card);
}

// --- C: Leave summary cards -----------------------------------
function renderSummaryCards(employee, records) {
  els.summaryGrid.innerHTML = '';
  const balances = calculateLeaveBalances(employee, records);

  for (const type of Object.values(LEAVE_TYPES)) {
    const balance = balances[type.id];
    const card = document.createElement('div');
    card.className = 'summary-card';

    const typeLabel = document.createElement('div');
    typeLabel.className = 'summary-type';
    typeLabel.textContent = type.label;
    card.appendChild(typeLabel);

    const figures = document.createElement('div');
    figures.className = 'summary-figures';
    card.appendChild(figures);

    if (type.paid && balance.allowance !== null) {
      renderPaidCard(card, figures, type, balance);
    } else {
      renderUnpaidCard(card, figures, balance);
    }

    els.summaryGrid.appendChild(card);
  }
}

function makeFigure(value, label, valueClass = 'figure-value') {
  const figure = document.createElement('div');
  figure.className = 'summary-figure';
  const valueEl = document.createElement('div');
  valueEl.className = valueClass;
  valueEl.textContent = value;
  const labelEl = document.createElement('div');
  labelEl.className = 'figure-label';
  labelEl.textContent = label;
  figure.append(valueEl, labelEl);
  return figure;
}

function renderPaidCard(card, figures, type, balance) {
  figures.appendChild(makeFigure(balance.used, 'Days used'));

  const remaining = makeFigure(
    String(balance.remaining),
    'Days remaining',
    balance.isOverAllocated ? 'figure-value negative' : 'figure-value remaining'
  );
  figures.appendChild(remaining);
  figures.appendChild(makeFigure(String(balance.allowance), 'Total allowance'));

  if (balance.isOverAllocated) {
    card.classList.add('overallocated');
    const warning = document.createElement('div');
    warning.className = 'card-warning';
    warning.textContent = 'Over-allocated: more approved leave than allowance.';
    card.appendChild(warning);
  }

  // Progress: used portion of the allowance. Can exceed 100% when
  // over-allocated, so clamp the bar width but keep true numbers.
  const track = document.createElement('div');
  track.className = 'progress-track';
  const fill = document.createElement('div');
  fill.className = 'progress-fill';
  const pct = Math.min(100, Math.max(0, (balance.used / balance.allowance) * 100));
  fill.style.width = `${pct}%`;
  if (balance.isOverAllocated) fill.style.background = 'var(--error-600)';
  track.appendChild(fill);
  card.appendChild(track);

  // Scheduled (future) days shown separately so they are visible
  // but never deducted twice.
  if (balance.scheduled > 0) {
    const note = document.createElement('div');
    note.className = 'card-note';
    note.textContent = `${balance.scheduled} more working day${balance.scheduled === 1 ? '' : 's'} scheduled — not yet deducted.`;
    card.appendChild(note);
  }
}

function renderUnpaidCard(card, figures, balance) {
  card.classList.add('unpaid');
  figures.appendChild(makeFigure(String(balance.used), 'Days taken'));
  figures.appendChild(makeFigure(String(balance.scheduled), 'Days scheduled'));
  const note = document.createElement('div');
  note.className = 'card-note';
  note.textContent = 'Unpaid leave has no annual allowance and does not reduce paid leave.';
  card.appendChild(note);
}

// --- D: Upcoming leave ----------------------------------------
function renderUpcoming(employee, records) {
  els.upcomingList.innerHTML = '';
  const upcoming = getUpcomingLeave(records, employee.id, TODAY);

  if (upcoming.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty-note';
    empty.textContent = `No upcoming or scheduled leave for ${employee.name}.`;
    els.upcomingList.appendChild(empty);
    return;
  }

  for (const record of upcoming) {
    const type = LEAVE_TYPES[record.leaveType];
    const status = LEAVE_STATUSES[record.status];
    const workingDays = countWorkingDays(record.startDate, record.endDate);

    const item = document.createElement('div');
    item.className = 'upcoming-item';

    const typeEl = document.createElement('span');
    typeEl.className = 'upcoming-type';
    typeEl.textContent = type.label;

    const datesEl = document.createElement('span');
    datesEl.className = 'upcoming-dates';
    datesEl.textContent = record.startDate === record.endDate
      ? formatDateRange(record.startDate)
      : `${formatDateRange(record.startDate, { month: 'short' })} → ${formatDateRange(record.endDate)}`;

    const daysEl = document.createElement('span');
    daysEl.className = 'upcoming-days';
    daysEl.textContent = `${workingDays} working day${workingDays === 1 ? '' : 's'}`;

    const badge = document.createElement('span');
    badge.className = `status-badge ${status.id}`;
    badge.textContent = status.label;

    item.append(typeEl, datesEl, daysEl, badge);
    els.upcomingList.appendChild(item);
  }
}

function formatDateRange(dateStr, options) {
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  });
}

// --- Calendar filter -------------------------------------------
function renderCalendarFilterOptions() {
  els.calendarFilter.innerHTML = '';
  const all = document.createElement('option');
  all.value = 'all';
  all.textContent = 'All employees';
  els.calendarFilter.appendChild(all);
  for (const employee of EMPLOYEES) {
    const option = document.createElement('option');
    option.value = employee.id;
    option.textContent = employee.name;
    els.calendarFilter.appendChild(option);
  }
}

// --- Render coordination ---------------------------------------
function render() {
  const employee = getSelectedEmployee();
  renderOverview(employee);
  renderSummaryCards(employee, LEAVE_RECORDS);
  renderUpcoming(employee, LEAVE_RECORDS);
}

function init() {
  renderEmployeeOptions();
  renderCalendarFilterOptions();

  els.employeeSelect.addEventListener('change', (event) => {
    state.selectedEmployeeId = event.target.value;
    render();
  });

  createCalendar(
    document.querySelector('.calendar-section'),
    LEAVE_RECORDS,
    2026,
    0 // start on January 2026
  );

  render();
}

init();
