import process from 'node:process';

/** Reads an environment variable, treating an empty value the same as an unset one. */
export function envOrDefault(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

/*
 * The e2e servers get their own ports, next to each other and away from the dev stack (Go on 3000,
 * Nuxt on 3001), so a run never reuses a dev server by accident. Set the variables to run two
 * checkouts' suites at the same time.
 */

/** The Go server the tests browse, which serves the pages and proxies /webapi. */
export const goPort = envOrDefault('PORT', '48123');

/** The Nuxt dev server behind the Go server. */
export const nuxtPort = envOrDefault('E2E_NUXT_PORT', '48124');

/** The mock API standing in for the Python backend. */
export const mockApiPort = envOrDefault('E2E_MOCK_API_PORT', '48125');
