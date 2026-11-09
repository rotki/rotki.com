/**
 * User-facing copy for the card-payment SPA. This package has no i18n runtime
 * (it ships a single locale), so strings live here rather than being scattered
 * through components: one place to review the wording, and the same shape a
 * translation layer would need if one is ever added.
 */
export const en = {
  // Keep in step with `campaign.*` in the website's en.json.
  campaign: {
    offer: 'Limited-time offer: {percent}% off your first payment with code {code}.',
    applied: 'Code {code} applied: {percent}% off your first payment.',
    lastDay: (date: string): string => `Last day ${date} (UTC).`,
  },
} as const;
