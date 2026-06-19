import type { LeaderboardEntry } from '~/modules/sponsor/leaderboard/types';
import { describe, expect, it } from 'vitest';
import {
  buildAddressDisplay,
  calculateOffset,
  createPlaceholderEntries,
  getDisplayRank,
  getRankClass,
} from '~/modules/sponsor/leaderboard/utils';
import { truncateAddress } from '~/utils/text';

const ADDRESS = '0x1234567890abcdef1234567890abcdef12345678';

function entry(overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return {
    rank: 1,
    address: ADDRESS,
    bronzeCount: 0,
    silverCount: 0,
    goldCount: 0,
    totalCount: 0,
    points: 0,
    ensName: null,
    ...overrides,
  };
}

describe('createPlaceholderEntries', () => {
  it('creates 5 placeholder entries by default', () => {
    const entries = createPlaceholderEntries();

    expect(entries).toHaveLength(5);
  });

  it('honours a custom count', () => {
    expect(createPlaceholderEntries(3)).toHaveLength(3);
  });

  it('assigns sequential ranks and zeroed counts', () => {
    const entries = createPlaceholderEntries(2);

    expect(entries[0]).toEqual({
      rank: 1,
      address: '',
      bronzeCount: 0,
      silverCount: 0,
      goldCount: 0,
      totalCount: 0,
      points: 0,
      ensName: null,
    });
    expect(entries[1]?.rank).toBe(2);
  });
});

describe('buildAddressDisplay', () => {
  it('shows ENS name with truncated address and tooltip', () => {
    const result = buildAddressDisplay({ address: ADDRESS, ensName: 'rotki.eth' }, false);

    expect(result).toEqual({
      primary: `rotki.eth - ${truncateAddress(ADDRESS)}`,
      showTooltip: true,
      isEns: true,
    });
  });

  it('keeps ENS formatting even when shortening is requested', () => {
    const result = buildAddressDisplay({ address: ADDRESS, ensName: 'rotki.eth' }, true);

    expect(result.isEns).toBe(true);
    expect(result.primary).toBe(`rotki.eth - ${truncateAddress(ADDRESS)}`);
  });

  it('shows the full address without tooltip when not shortening', () => {
    const result = buildAddressDisplay({ address: ADDRESS, ensName: null }, false);

    expect(result).toEqual({
      primary: ADDRESS,
      showTooltip: false,
      isEns: false,
    });
  });

  it('truncates the address with a tooltip when shortening', () => {
    const result = buildAddressDisplay({ address: ADDRESS, ensName: null }, true);

    expect(result).toEqual({
      primary: truncateAddress(ADDRESS),
      showTooltip: true,
      isEns: false,
    });
  });
});

describe('calculateOffset', () => {
  it('returns 0 for the first page', () => {
    expect(calculateOffset(1, 10)).toBe(0);
  });

  it('multiplies the zero-based page index by the limit', () => {
    expect(calculateOffset(3, 25)).toBe(50);
  });
});

describe('getDisplayRank', () => {
  it('uses the backend-provided rank when present', () => {
    expect(getDisplayRank(entry({ rank: 7 }), 0, 1, 10)).toBe(7);
  });

  it('derives the rank from page/index when rank is null', () => {
    expect(getDisplayRank(entry({ rank: null }), 0, 1, 10)).toBe(1);
    expect(getDisplayRank(entry({ rank: null }), 2, 3, 10)).toBe(23);
  });

  it('derives the rank when rank is 0 (falsy)', () => {
    expect(getDisplayRank(entry({ rank: 0 }), 4, 2, 25)).toBe(30);
  });
});

describe('getRankClass', () => {
  it('returns medal classes for the top three on page 1', () => {
    expect(getRankClass(1, 0)).toEqual({ 'text-yellow-400': true, 'text-gray-400': false, 'text-amber-500': false });
    expect(getRankClass(1, 1)).toEqual({ 'text-yellow-400': false, 'text-gray-400': true, 'text-amber-500': false });
    expect(getRankClass(1, 2)).toEqual({ 'text-yellow-400': false, 'text-gray-400': false, 'text-amber-500': true });
  });

  it('returns the muted class for entries beyond the top three', () => {
    expect(getRankClass(1, 3)).toBe('text-rui-text-secondary');
  });

  it('returns the muted class for all entries on later pages', () => {
    expect(getRankClass(2, 0)).toBe('text-rui-text-secondary');
  });
});
