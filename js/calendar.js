// ============================================================
// calendar.js — month grid rendering, navigation, filtering,
// and date selection. Reads data + calculations, owns no state
// beyond the currently displayed month.
// ============================================================

import {
  EMPLOYEES,
  LEAVE_TYPES,
  LEAVE_STATUSES,
} from './data.js';
import {
  parseDate,
  toDateKey,
  getDatesInRange,
  countWorkingDays,
} from './calculations.js';

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Status ring colours: each status gets a strong, distinct ring
// around the employee-coloured dot (see style.css).
const STATUS_STYLES = {
  approved: 'approved',
  scheduled: 'scheduled',
  pending: 'pending',
};

export function createCalendar(container, records, initialYear, initialMonth) {
  // monthIndex: 0–11, like Date months.
  const calendar = {
    year: initialYear,
    monthIndex: initialMonth,
    employeeFilter: 'all',
    selectedDate: null,
  };

  const els = {
    heading: container.querySelector('[data-calendar-heading]'),
    grid: container.querySelector('[data-calendar-grid]'),
    prevBtn: container.querySelector('[data-calendar-prev]'),
    nextBtn: container.querySelector('[data-calendar-next]'),
    filter: container.querySelector('[data-calendar-filter]'),
    legend: container.querySelector('[data-calendar-legend]'),
    detail: container.querySelector('[data-calendar-detail]'),
  };

  // Records keyed by every date they cover, for fast grid lookups.
  function indexRecordsByDate() {
    const byDate = new Map();
    for (const record of records) {
      if (record.status === LEAVE_STATUSES.rejected.id ||
          record.status === LEAVE_STATUSES.cancelled.id) {
        continue; // never shown on the calendar
      }
      if (calendar.employeeFilter !== 'all' &&
          record.employeeId !== calendar.employeeFilter) {
        continue;
      }
      for (const dateKey of getDatesInRange(record.startDate, record.endDate)) {
        if (!byDate.has(dateKey)) byDate.set(dateKey, []);
        byDate.get(dateKey).push(record);
      }
    }
    return byDate;
  }

  function employeeById(id) {
    return EMPLOYEES.find((e) => e.id === id);
  }

  function renderLegend() {
    els.legend.innerHTML = '';

    const employeeGroup = document.createElement('div');
    employeeGroup.className = 'legend-group';
    const shownEmployees = calendar.employeeFilter === 'all'
      ? EMPLOYEES
      : EMPLOYEES.filter((e) => e.id === calendar.employeeFilter);
    for (const employee of shownEmployees) {
      employeeGroup.appendChild(
        makeLegendItem('swatch', employee.color, employee.name)
      );
    }
    els.legend.appendChild(employeeGroup);

    const statusGroup = document.createElement('div');
    statusGroup.className = 'legend-group';
    for (const statusId of ['approved', 'scheduled', 'pending']) {
      statusGroup.appendChild(
        makeLegendItem(STATUS_STYLES[statusId], null, LEAVE_STATUSES[statusId].label)
      );
    }
    els.legend.appendChild(statusGroup);
  }

  function makeLegendItem(styleClass, color, label) {
    const item = document.createElement('span');
    item.className = 'legend-item';
    const dot = document.createElement('span');
    dot.className = `legend-dot ${styleClass}`;
    if (color) dot.style.background = color;
    const text = document.createElement('span');
    text.textContent = label;
    item.append(dot, text);
    return item;
  }

  function renderGrid() {
    els.heading.textContent = `${MONTH_NAMES[calendar.monthIndex]} ${calendar.year}`;
    els.grid.innerHTML = '';

    for (const label of WEEKDAY_LABELS) {
      const cell = document.createElement('div');
      cell.className = 'calendar-weekday';
      cell.textContent = label;
      els.grid.appendChild(cell);
    }

    const first = parseDate(`${calendar.year}-${String(calendar.monthIndex + 1).padStart(2, '0')}-01`);
    // Grid starts on Monday; (day + 6) % 7 converts Sun=0 to Mon=0.
    const leadingBlanks = (first.getUTCDay() + 6) % 7;
    const daysInMonth = new Date(
      Date.UTC(calendar.year, calendar.monthIndex + 1, 0, 12)
    ).getUTCDate();

    const todayKey = toDateKey(new Date());

    for (let i = 0; i < leadingBlanks; i += 1) {
      const blank = document.createElement('div');
      blank.className = 'calendar-day other-month';
      els.grid.appendChild(blank);
    }

    const byDate = indexRecordsByDate();

    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateKey = `${calendar.year}-${String(calendar.monthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const cell = document.createElement('div');
      cell.className = 'calendar-day';
      cell.setAttribute('role', 'button');
      cell.tabIndex = 0;
      cell.dataset.date = dateKey;

      if (dateKey === todayKey) cell.classList.add('today');
      if (dateKey === calendar.selectedDate) cell.classList.add('selected');

      const dayNumber = document.createElement('span');
      dayNumber.className = 'day-number';
      dayNumber.textContent = String(day);
      cell.appendChild(dayNumber);

      const dayRecords = byDate.get(dateKey) || [];

      if (dayRecords.length > 0) {
        cell.classList.add('has-leave');
        const strongest = strongestStatus(dayRecords);
        cell.classList.add(`leave-${STATUS_STYLES[strongest]}`);

        // Keep one employee-coloured dot per employee.
        const uniqueEmployees = [...new Set(dayRecords.map((record) => record.employeeId))];
        const indicatorWrap = document.createElement('div');
        indicatorWrap.className = 'day-indicators';
        for (const employeeId of uniqueEmployees.slice(0, 3)) {
          const employee = employeeById(employeeId);
          const dot = document.createElement('span');
          dot.className = 'day-dot';
          dot.style.background = employee.color;
          dot.title = employee.name;
          indicatorWrap.appendChild(dot);
        }
        if (uniqueEmployees.length > 3) {
          const more = document.createElement('span');
          more.className = 'day-more';
          more.textContent = `+${uniqueEmployees.length - 3}`;
          indicatorWrap.appendChild(more);
        }
        cell.appendChild(indicatorWrap);

        cell.setAttribute('aria-label',
          `${dayRecords.length} leave record${dayRecords.length > 1 ? 's' : ''} on this date`);
      }

      const dow = parseDate(dateKey).getUTCDay();
      if (dow === 0 || dow === 6) cell.classList.add('weekend');

      els.grid.appendChild(cell);
    }
  }

  // Within one employee's day: approved > scheduled > pending,
  // so the strongest status decides the dot style.
  function strongestStatus(recordsForDay) {
    const order = ['approved', 'scheduled', 'pending'];
    for (const statusId of order) {
      if (recordsForDay.some((r) => r.status === statusId)) return statusId;
    }
    return recordsForDay[0].status;
  }

  function renderDetail(dateKey) {
    els.detail.innerHTML = '';
    if (!dateKey) {
      const hint = document.createElement('p');
      hint.className = 'detail-hint';
      hint.textContent = 'Select a date to see who is off and their leave details.';
      els.detail.appendChild(hint);
      return;
    }

    const byDate = indexRecordsByDate();
    const dayRecords = byDate.get(dateKey) || [];

    const title = document.createElement('h3');
    title.className = 'detail-title';
    title.textContent = formatDateLong(dateKey);
    els.detail.appendChild(title);

    if (dayRecords.length === 0) {
      const empty = document.createElement('p');
      empty.className = 'detail-hint';
      empty.textContent = 'No leave on this date.';
      els.detail.appendChild(empty);
      return;
    }

    const list = document.createElement('ul');
    list.className = 'detail-list';

    for (const record of dayRecords) {
      const employee = employeeById(record.employeeId);
      const type = LEAVE_TYPES[record.leaveType];
      const status = LEAVE_STATUSES[record.status];
      const workingDays = countWorkingDays(record.startDate, record.endDate);

      const item = document.createElement('li');
      item.className = 'detail-item';

      const dot = document.createElement('span');
      dot.className = 'legend-dot solid';
      dot.style.background = employee.color;
      dot.setAttribute('aria-hidden', 'true');

      const body = document.createElement('div');
      body.className = 'detail-body';

      const name = document.createElement('div');
      name.className = 'detail-name';
      name.textContent = employee.name;

      const line = document.createElement('div');
      line.className = 'detail-line';
      const range = record.startDate === record.endDate
        ? formatDateLong(record.startDate)
        : `${formatDateLong(record.startDate)} → ${formatDateLong(record.endDate)}`;
      line.textContent =
        `${type.label} · ${range} · ${workingDays} working day${workingDays === 1 ? '' : 's'}`;

      body.append(name, line);

      const badge = document.createElement('span');
      badge.className = `status-badge ${status.id}`;
      badge.textContent = status.label;

      item.append(dot, body, badge);
      list.appendChild(item);
    }

    els.detail.appendChild(list);
  }

  function formatDateLong(dateKey) {
    return parseDate(dateKey).toLocaleDateString('en-GB', {
      timeZone: 'UTC',
      weekday: 'short',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  function render() {
    renderLegend();
    renderGrid();
    renderDetail(calendar.selectedDate);
  }

  // --- Events -----------------------------------------------
  els.prevBtn.addEventListener('click', () => {
    calendar.monthIndex -= 1;
    if (calendar.monthIndex < 0) {
      calendar.monthIndex = 11;
      calendar.year -= 1;
    }
    renderGrid();
  });

  els.nextBtn.addEventListener('click', () => {
    calendar.monthIndex += 1;
    if (calendar.monthIndex > 11) {
      calendar.monthIndex = 0;
      calendar.year += 1;
    }
    renderGrid();
  });

  els.filter.addEventListener('change', (event) => {
    calendar.employeeFilter = event.target.value;
    render();
  });

  function handleDatePick(event) {
    const cell = event.target.closest('.calendar-day');
    if (!cell || !cell.dataset.date) return;
    calendar.selectedDate = calendar.selectedDate === cell.dataset.date
      ? null
      : cell.dataset.date;
    renderGrid();
    renderDetail(calendar.selectedDate);
  }

  els.grid.addEventListener('click', handleDatePick);
  els.grid.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleDatePick(event);
    }
  });

  render();
}

