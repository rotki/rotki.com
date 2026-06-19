/**
 * Validates that a redirect URL stays within the same domain (including subdomains).
 * Returns the validated URL if safe, or the fallback path otherwise.
 */
export function getSafeRedirectUrl(url: string, fallback: string = '/home/subscription'): string {
  try {
    if (!url)
      return fallback;

    const decoded = decodeURIComponent(url);
    if (!decoded)
      return fallback;

    // Allow relative paths (they're always same-origin)
    if (decoded.startsWith('/') && !decoded.startsWith('//'))
      return decoded;

    return isSameOriginAbsoluteUrl(decoded) ? decoded : fallback;
  }
  catch {
    return fallback;
  }
}

// Validates an absolute URL is http(s) on the current host (or a subdomain of it).
function isSameOriginAbsoluteUrl(decoded: string): boolean {
  // Reject URLs that don't start with a known scheme — prevents relative-URL
  // resolution of malformed strings like "ht tp://..." into same-origin paths
  if (!/^https?:\/\//i.test(decoded))
    return false;

  const target = new URL(decoded, window.location.origin);
  const currentHostname = window.location.hostname;

  // Reject non-http(s) protocols
  if (target.protocol !== 'http:' && target.protocol !== 'https:')
    return false;

  // Allow exact match or subdomain match
  return target.hostname === currentHostname || isSubdomainOf(target.hostname, currentHostname);
}

function isSubdomainOf(hostname: string, parentHostname: string): boolean {
  // Extract root domain from both hostnames and compare
  const targetRoot = getRootDomain(hostname);
  const currentRoot = getRootDomain(parentHostname);
  return targetRoot === currentRoot;
}

function getRootDomain(hostname: string): string {
  const parts = hostname.split('.');
  // For localhost or single-part hostnames, return as-is
  if (parts.length <= 2)
    return hostname;

  // Return last two parts (e.g., "rotki.com" from "app.rotki.com")
  return parts.slice(-2).join('.');
}
