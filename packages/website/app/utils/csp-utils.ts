import type { ContentSecurityPolicyValue } from 'nuxt-security';

/**
 * Removes nonce placeholders from CSP configuration
 * Useful for runtime CSP generation where nonces need to be replaced with actual values
 */
export function removeNoncePlaceholders(csp: ContentSecurityPolicyValue): ContentSecurityPolicyValue {
  const cleaned: ContentSecurityPolicyValue = {};

  for (const [directive, values] of Object.entries(csp)) {
    if (Array.isArray(values)) {
      cleaned[directive] = values.filter(value =>
        !value.includes('nonce-') && !value.includes('{{nonce}}'),
      );
    }
  }

  return cleaned;
}

/**
 * Checks if a CSP configuration contains nonce placeholders
 */
export function hasNoncePlaceholders(csp: ContentSecurityPolicyValue): boolean {
  for (const values of Object.values(csp)) {
    if (Array.isArray(values)) {
      for (const value of values) {
        if (value.includes('nonce-') || value.includes('{{nonce}}')) {
          return true;
        }
      }
    }
  }
  return false;
}
