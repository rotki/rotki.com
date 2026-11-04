const longDateFormatter = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

/**
 * Formats a date the one way the checkout shows dates: "November 2, 2026". Returns an
 * empty string for an invalid date instead of "Invalid Date".
 */
export function formatLongDate(date: Date): string {
  return Number.isNaN(date.getTime()) ? '' : longDateFormatter.format(date);
}

/** When a plan bought on `from` renews: the same day, `durationInMonths` later. */
export function renewalDateFrom(durationInMonths: number, from: Date = new Date()): Date {
  const renewal = new Date(from);
  renewal.setMonth(renewal.getMonth() + durationInMonths);
  return renewal;
}
