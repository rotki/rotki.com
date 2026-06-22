import type { AddressDisplay, LeaderboardEntry } from '~/modules/sponsor/leaderboard/types';
import { truncateAddress } from '~/modules/web3/core/format';

const PLACEHOLDER_ENTRY_COUNT = 5;

/**
 * Builds placeholder entries shown during the initial load to reserve layout
 * space before real data arrives.
 */
export function createPlaceholderEntries(count = PLACEHOLDER_ENTRY_COUNT): LeaderboardEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    rank: i + 1,
    address: '',
    bronzeCount: 0,
    silverCount: 0,
    goldCount: 0,
    totalCount: 0,
    points: 0,
    ensName: null,
  }));
}

/**
 * Resolves how a single entry's address should be displayed.
 * - ENS names are always shown with the truncated address and a tooltip.
 * - Plain addresses are truncated (with a tooltip) only on smaller screens.
 */
export function buildAddressDisplay(
  entry: Pick<LeaderboardEntry, 'address' | 'ensName'>,
  shouldShorten: boolean,
): AddressDisplay {
  if (entry.ensName) {
    return {
      primary: `${entry.ensName} - ${truncateAddress(entry.address)}`,
      showTooltip: true,
      isEns: true,
    };
  }

  return {
    primary: shouldShorten ? truncateAddress(entry.address) : entry.address,
    showTooltip: shouldShorten,
    isEns: false,
  };
}

/**
 * Offset (number of items to skip) for the given 1-based page and page size.
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Display rank for an entry. Falls back to a computed rank derived from the
 * page/index when the backend did not provide one.
 */
export function getDisplayRank(
  entry: Pick<LeaderboardEntry, 'rank'>,
  index: number,
  page: number,
  limit: number,
): number {
  return entry.rank || (index + 1 + calculateOffset(page, limit));
}

/**
 * Colour classes for the rank badge. The top three entries on the first page
 * get medal colours (gold/silver/bronze); everything else is muted.
 */
export function getRankClass(page: number, index: number): string | Record<string, boolean> {
  if (page === 1 && index <= 2) {
    return {
      'text-yellow-400': index === 0,
      'text-gray-400': index === 1,
      'text-amber-500': index === 2,
    };
  }
  return 'text-rui-text-secondary';
}
