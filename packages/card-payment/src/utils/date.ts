/**
 * Formats a Date object to a localized string in en-US format.
 * Example output: "December 22, 2025"
 */
export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}
