/**
 * Names the last day of a campaign in UTC, e.g. "September 29", or undefined without a
 * usable end. The end is the instant the offer stops, so an end at midnight UTC names the
 * day before, and every visitor sees the same date regardless of their timezone.
 */
export function formatCampaignLastDay(periodEnd: string | undefined): string | undefined {
  if (!periodEnd)
    return undefined;

  const end = Date.parse(periodEnd);
  if (Number.isNaN(end))
    return undefined;

  return new Date(end - 1).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });
}
