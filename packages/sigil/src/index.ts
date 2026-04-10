// @rotki/sigil — shared analytics catalog and helpers for the rotki.com
// Sigil tracker. Framework-agnostic; Nuxt composables and cookie I/O live in
// the host packages.
//
// File layout:
//   - events.ts    — `SigilEvents` event-name catalog
//   - common.ts    — shared enum-like consts (CheckoutPaymentMethods, ...)
//   - failures.ts  — `PaymentFailures` catalog + crypto error classifier
//   - payloads.ts  — typed payloads, one per event in `SigilEvents`
//   - tracking.ts  — `sigilTrack` wrapper, UTM contract, pure tracking helpers

// Single source of truth for the Sigil script and website id. Static HTML
// files (e.g. the card-payment SPA `index.html`) can't import this and have
// to hardcode the same values — keep them in sync.

export const SIGIL_SCRIPT_URL = 'https://sigil.rotki.com/s.js';

export const SIGIL_WEBSITE_ID = 'd49a6a25-cdf7-468e-bfc2-2059867b54e0';

export const SIGIL_TRACKED_DOMAIN = 'rotki.com';

export * from './case';

export * from './common';

export * from './events';

export * from './failures';

export * from './logging';

export * from './payloads';

export * from './tracking';
