import { afterEach, describe, expect, it } from 'vitest';
import { getDurationFromUrlParam, getNumericUrlParam, getUrlParam } from './navigation';

function setSearch(search: string): void {
  window.history.replaceState({}, '', `${window.location.pathname}${search}`);
}

describe('utils/navigation', () => {
  afterEach(() => {
    setSearch('');
  });

  describe('getUrlParam', () => {
    it('returns the query value', () => {
      setSearch('?planId=42');
      expect(getUrlParam('planId')).toBe('42');
    });

    it('falls back to the default value, then to null', () => {
      expect(getUrlParam('planId', 'fallback')).toBe('fallback');
      expect(getUrlParam('planId')).toBeNull();
    });
  });

  describe('getDurationFromUrlParam', () => {
    it.each([
      ['', '12'],
      ['?duration=12', '12'],
      ['?duration=1', '1'],
      ['?duration=6', '1'],
    ])('maps search "%s" to %s months', (search, expected) => {
      setSearch(search);
      expect(getDurationFromUrlParam('duration')).toBe(expected);
    });
  });

  describe('getNumericUrlParam', () => {
    it('returns the default when the param is missing', () => {
      expect(getNumericUrlParam('amount', 5)).toBe(5);
    });

    it('parses a numeric value', () => {
      setSearch('?amount=12.5');
      expect(getNumericUrlParam('amount', 5)).toBe(12.5);
    });

    it('returns the default for a non-numeric value', () => {
      setSearch('?amount=abc');
      expect(getNumericUrlParam('amount', 5)).toBe(5);
    });
  });
});
