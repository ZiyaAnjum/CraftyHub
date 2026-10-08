/**
 * Shared Date Helpers for Asia/Kolkata (IST: UTC+05:30)
 */

const TIME_ZONE = 'Asia/Kolkata';

/**
 * Format a date and time in Asia/Kolkata timezone.
 * Example output: "07 Oct 2026, 05:30 PM"
 */
export function formatKolkataDateTime(dateInput) {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '—';

  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: TIME_ZONE,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return d.toLocaleString('en-IN');
  }
}

/**
 * Format date only in Asia/Kolkata timezone.
 * Example output: "07 Oct 2026"
 */
export function formatKolkataDate(dateInput) {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '—';

  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: TIME_ZONE,
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return d.toLocaleDateString('en-IN');
  }
}

/**
 * Format time only in Asia/Kolkata timezone.
 * Example output: "05:30 PM"
 */
export function formatKolkataTime(dateInput) {
  if (!dateInput) return '—';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '—';

  try {
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: TIME_ZONE,
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return d.toLocaleTimeString('en-IN');
  }
}

/**
 * Convert a Date or ISO string into "YYYY-MM-DDTHH:mm" in Asia/Kolkata timezone
 * for binding with <input type="datetime-local" />.
 */
export function toKolkataDateTimeLocalInput(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d);

  const get = (type) => parts.find((p) => p.type === type)?.value || '';
  const y = get('year');
  const m = get('month');
  const day = get('day');
  let h = get('hour');
  // Handle edge case where hour 24 is formatted in some locales
  if (h === '24') h = '00';
  const min = get('minute');

  return `${y}-${m}-${day}T${h}:${min}`;
}

/**
 * Returns true if an order is overdue:
 * readyBy has passed, and status is not 'ready', 'delivered', or 'cancelled'.
 */
export function isOrderOverdue(order) {
  if (!order || !order.readyBy) return false;
  const readyDate = new Date(order.readyBy);
  if (isNaN(readyDate.getTime())) return false;
  const now = new Date();
  const terminalOrReady = ['ready', 'delivered', 'cancelled'].includes(order.status);
  return readyDate.getTime() < now.getTime() && !terminalOrReady;
}

/**
 * Returns true if an order is due within the next 24 hours:
 * readyBy is in the future, within 24h, and status is not 'ready', 'delivered', or 'cancelled'.
 */
export function isOrderDueSoon(order) {
  if (!order || !order.readyBy) return false;
  const readyDate = new Date(order.readyBy);
  if (isNaN(readyDate.getTime())) return false;
  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const terminalOrReady = ['ready', 'delivered', 'cancelled'].includes(order.status);
  return (
    readyDate.getTime() >= now.getTime() &&
    readyDate.getTime() <= in24h.getTime() &&
    !terminalOrReady
  );
}

/**
 * Returns today's date formatted as "YYYY-MM-DD" in Asia/Kolkata timezone.
 * Ideal for setting min attribute on <input type="date" />.
 */
export function getTodayKolkataDateString() {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date());

  const y = parts.find((p) => p.type === 'year')?.value || '';
  const m = parts.find((p) => p.type === 'month')?.value || '';
  const d = parts.find((p) => p.type === 'day')?.value || '';
  return `${y}-${m}-${d}`;
}

