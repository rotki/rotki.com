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
