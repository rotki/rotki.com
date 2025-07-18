/**
 * Utilities for normalizing cache keys to prevent cache manipulation
 */

/**
 * Normalize URLs for use as cache keys
 * - Extracts CID for IPFS URLs
 * - Sorts and filters query parameters for HTTP URLs
 * - Ensures consistent casing
 */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // For IPFS URLs
    if (parsed.protocol === 'ipfs:') {
      // For ipfs:// URLs, the CID is in the hostname part
      const cid = parsed.hostname || parsed.pathname.replace(/^\/+/, '');
      return `ipfs:${cid}`;
    }

    // For HTTP(S) URLs
    // Sort query params and remove tracking params
    const params = new URLSearchParams(parsed.search);
    const allowedParams = ['token', 'network', 'tierIds', '_t']; // whitelist approach

    const filtered = new URLSearchParams();
    const sortedKeys = Array.from(params.keys()).sort();

    for (const key of sortedKeys) {
      if (allowedParams.includes(key)) {
        const value = params.get(key);
        if (value) {
          filtered.append(key, value);
        }
      }
    }

    parsed.search = filtered.toString();
    return parsed.toString().toLowerCase();
  }
  catch {
    // Fallback for non-URL strings
    return url.toLowerCase().trim();
  }
}

/**
 * Create a cache key for NFT tier info
 */
export function createTierCacheKey(contractAddress: string, releaseId: number, tierId: number): string {
  return `tier:${contractAddress.toLowerCase()}:${releaseId}:${tierId}`;
}

/**
 * Create a cache key for NFT metadata
 */
export function createMetadataCacheKey(metadataURI: string): string {
  return `metadata:${normalizeUrl(metadataURI)}`;
}

/**
 * Create a cache key for NFT images
 */
export function createImageCacheKey(imageUrl: string): string {
  return `image:${normalizeUrl(imageUrl)}`;
}

/**
 * Create a cache key for NFT token data
 */
export function createNftTokenCacheKey(contractAddress: string, tokenId: number): string {
  return `token:${contractAddress.toLowerCase()}:${tokenId}`;
}
