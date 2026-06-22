import type { TierSupply } from '~/modules/web3/sponsorship/types';
import { describe, expect, it } from 'vitest';
import { findTierById, findTierByKey, isTierAvailable } from '~/modules/web3/sponsorship/utils';

function supply(currentSupply: number, maxSupply: number): TierSupply {
  return { currentSupply, maxSupply, metadataURI: '' };
}

describe('sponsorship/utils', () => {
  describe('findTierById', () => {
    it('finds by numeric and string id', () => {
      expect(findTierById(0)?.key).toBe('bronze');
      expect(findTierById('2')?.key).toBe('gold');
    });

    it('returns undefined for an unknown id', () => {
      expect(findTierById(99)).toBeUndefined();
    });
  });

  describe('findTierByKey', () => {
    it('finds by key', () => {
      expect(findTierByKey('silver')?.tierId).toBe(1);
    });

    it('returns undefined for an unknown key', () => {
      expect(findTierByKey('platinum')).toBeUndefined();
    });
  });

  describe('isTierAvailable', () => {
    it('is available while currentSupply < maxSupply', () => {
      expect(isTierAvailable('gold', { gold: supply(3, 10) })).toBe(true);
    });

    it('treats maxSupply 0 as unlimited', () => {
      expect(isTierAvailable('gold', { gold: supply(999, 0) })).toBe(true);
    });

    it('is unavailable when sold out', () => {
      expect(isTierAvailable('gold', { gold: supply(10, 10) })).toBe(false);
    });

    it('is unavailable when the tier is missing', () => {
      expect(isTierAvailable('gold', {})).toBe(false);
    });
  });
});
