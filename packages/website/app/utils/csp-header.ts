import type { ContentSecurityPolicyValue } from 'nuxt-security';
import crypto from 'node:crypto';

function generateRandomNonce() {
  const array = new Uint8Array(18);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array));
}

/**
 * Convert CSP object to header string format with nonce support
 * This is based on nuxt-security's headerStringFromObject function for CSP
 */
export function cspObjectToString(cspPolicy: ContentSecurityPolicyValue, nonce: string = generateRandomNonce()): string {
  if (cspPolicy === false) {
    return '';
  }

  // Generate nonce if not provided and CSP contains nonce placeholders
  const actualNonce = nonce || 'replace-with-nonce';

  return Object.entries(cspPolicy)
    .filter(([, value]) => value !== false)
    .map(([directive, sources]) => {
      if (directive === 'upgrade-insecure-requests') {
        return 'upgrade-insecure-requests;';
      }
      else {
        let stringifiedSources: string;

        if (typeof sources === 'string') {
          stringifiedSources = sources;
        }
        else if (Array.isArray(sources)) {
          stringifiedSources = sources
            .map((source: string) =>
              // Replace nonce placeholders with actual nonce
              source
                .replace(/{{nonce}}/g, actualNonce)
                .replace(/'nonce-{{nonce}}'/g, `'nonce-${actualNonce}'`)
                .trim(),
            )
            .join(' ');
        }
        else {
          stringifiedSources = String(sources);
        }

        return `${directive} ${stringifiedSources};`;
      }
    })
    .join(' ');
}
