import type { ContentSecurityPolicyValue } from 'nuxt-security';
import { cspObjectToString } from '#shared/utils/csp-header';
import { type H3Event, setHeader } from 'h3';
import { baseCSP, braintreeBaseCSP, createDevCSP, mergeCSP } from '~~/csp-config';

/**
 * Apply security headers for HTML documents in card payment routes
 */
export function applyCardPaymentHtmlSecurityHeaders(event: H3Event): void {
  // Build CSP using base + braintree only
  const cspConfigs = [baseCSP, braintreeBaseCSP];

  // Add dev CSP if in development
  if (process.env.NODE_ENV === 'development') {
    const devCSP = createDevCSP(
      Number(process.env.NUXT_DEV_PORT) || 3000,
      Number(process.env.NUXT_HMR_PORT) || 4000,
    );
    cspConfigs.push(devCSP);
  }

  // Add additional CSP for card payment specific needs
  const cardPaymentCSP: ContentSecurityPolicyValue = {
    'img-src': [
      'rotki.com',
      'localhost',
    ],
  };
  cspConfigs.push(cardPaymentCSP);

  const mergedCSP = mergeCSP(...cspConfigs);
  const cspHeaderValue = cspObjectToString(mergedCSP);

  // Apply security headers for HTML documents
  setHeader(event, 'Content-Security-Policy', cspHeaderValue);
  setHeader(event, 'Cross-Origin-Opener-Policy', 'same-origin');
  // Use 'unsafe-none' for COEP to allow Braintree hosted fields and assets
  setHeader(event, 'Cross-Origin-Embedder-Policy', 'unsafe-none');
  // Use 'cross-origin' for CORP to allow Braintree resources
  setHeader(event, 'Cross-Origin-Resource-Policy', 'cross-origin');
  setHeader(event, 'X-Frame-Options', 'DENY');
  setHeader(event, 'X-Download-Options', 'noopen');
  setHeader(event, 'X-Permitted-Cross-Domain-Policies', 'none');
  setHeader(event, 'Origin-Agent-Cluster', '?1');
  setHeader(event, 'Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=()');
  setHeader(event, 'Cache-Control', 'no-store, no-cache, must-revalidate, private');
  setHeader(event, 'Pragma', 'no-cache');
  setHeader(event, 'Expires', '0');
}

/**
 * Apply security headers for static assets in card payment routes
 */
export function applyCardPaymentAssetSecurityHeaders(event: H3Event): void {
  // Basic security headers for assets
  setHeader(event, 'Cross-Origin-Resource-Policy', 'same-origin');
  setHeader(event, 'X-Content-Type-Options', 'nosniff');
}
