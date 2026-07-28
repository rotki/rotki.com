import { writeFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Client-only routes: `ssr: false` keeps them SPA in BOTH dev and build (so dev
 * matches the production 200.html SPA fallback, and no session/redirect is ever
 * server-rendered). Reasons: auth, guest-only, tokens, OAuth, payment.
 *
 * These routes are deliberately absent from the generated output, so the Go
 * static handler must fall back to the SPA shell for them. It reads that list
 * from the `spa-routes.json` manifest and hard-404s everything else, so adding a
 * client-only route here is the ONLY thing needed to keep the backend in sync.
 */
export const clientOnlyRoutes: string[] = [
  '/home/**',
  '/checkout/pay/method',
  '/checkout/pay/paypal',
  '/checkout/pay/crypto',
  '/checkout/pay/request-crypto',
  '/checkout/pay/3d-secure',
  // Payment confirmation, gated on a sessionStorage flag.
  '/checkout/success',
  // Guest-only route (bakes in a redirect for authenticated users otherwise).
  '/login',
  // OAuth callbacks, read window.location and sessionStorage (PKCE) at setup.
  '/oauth/**',
  // Dynamic token routes + recover/send/changed forms (runtime backend state).
  '/activate/**',
  '/password/**',
  // Web3-wallet utility page, noindex, no SEO value, so keep it client-only.
  '/sponsor/submit-name',
];

/**
 * Nested standalone SPAs copied into the static output after `nuxt generate`
 * (see `build:copy` in the root package.json). They own their subtree and ship
 * their own index.html, so deep links inside them must fall back to that file
 * rather than to the Nuxt shell.
 */
export const nestedApps: { prefix: string; index: string }[] = [
  { prefix: '/checkout/pay/card', index: 'checkout/pay/card/index.html' },
];

/** Route rules marking every client-only route as unrendered. */
export function clientOnlyRouteRules(): Record<string, { ssr: boolean; prerender: boolean }> {
  return Object.fromEntries(
    clientOnlyRoutes.map(route => [route, { ssr: false, prerender: false }]),
  );
}

/**
 * Build-time helper: writes the SPA fallback manifest the Go static handler
 * reads at startup. Derived from `clientOnlyRoutes` so the backend can never
 * drift from the routes Nuxt actually leaves unrendered. Without this file the
 * handler refuses to start rather than silently serving 200 for every path.
 */
export function writeSpaManifest(publicDir: string): void {
  const manifest = {
    // Generated file. Edit `clientOnlyRoutes` in app/utils/spa-routes.ts instead.
    spaShell: '200.html',
    // The prerendered `/not-found` page, NOT `404.html`. Nuxt always emits
    // `404.html` as an un-hydrated SPA fallback shell, which is blank without
    // JavaScript; `not-found/index.html` has the real markup baked in.
    notFound: 'not-found/index.html',
    spaRoutes: clientOnlyRoutes,
    nestedApps,
  };
  writeFileSync(path.join(publicDir, 'spa-routes.json'), `${JSON.stringify(manifest, undefined, 2)}\n`);
}
