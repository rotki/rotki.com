import { IPFS_URL } from '~/composables/rotki-sponsorship/constants';
import { SPONSORSHIP_TIERS, type TierSupply } from './types';

/**
 * Unified tier availability check function
 */
export function isTierAvailable(tierKey: string, tierSupply: Record<string, TierSupply>): boolean {
  const supply = tierSupply[tierKey];

  if (!supply)
    return false;

  // maxSupply = 0 means unlimited
  if (supply.maxSupply === 0)
    return true;

  return supply.currentSupply < supply.maxSupply;
}

/**
 * Find tier by key with proper typing
 */
export function findTierByKey(tierKey: string) {
  return SPONSORSHIP_TIERS.find(t => t.key === tierKey);
}

/**
 * Find tier by id with proper typing
 */
export function findTierById(tierId: number | string) {
  return SPONSORSHIP_TIERS.find(t => t.tierId === Number(tierId));
}

/**
 * Convert IPFS URL to HTTP URL
 */
export function normalizeIpfsUrl(url: string): string {
  if (url && url.startsWith('ipfs://')) {
    return `${IPFS_URL}${url.slice(7)}`;
  }
  return url;
}
