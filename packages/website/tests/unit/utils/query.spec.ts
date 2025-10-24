import { describe, expect, it } from 'vitest';
import { buildQueryParams } from '~/utils/query';

describe('buildQueryParams', () => {
  it('should build query params with all valid values', () => {
    const result = buildQueryParams({
      planId: 123,
      currency: 'USD',
      id: 'sub-123',
    });

    expect(result).toEqual({
      planId: '123',
      currency: 'USD',
      id: 'sub-123',
    });
  });

  it('should filter out null values', () => {
    const result = buildQueryParams({
      planId: 123,
      currency: null,
      id: 'sub-123',
    });

    expect(result).toEqual({
      planId: '123',
      id: 'sub-123',
    });
  });

  it('should filter out undefined values', () => {
    const result = buildQueryParams({
      planId: 123,
      currency: undefined,
      id: 'sub-123',
    });

    expect(result).toEqual({
      planId: '123',
      id: 'sub-123',
    });
  });

  it('should filter out empty string values', () => {
    const result = buildQueryParams({
      planId: 123,
      currency: '',
      id: 'sub-123',
    });

    expect(result).toEqual({
      planId: '123',
      id: 'sub-123',
    });
  });

  it('should convert all values to strings', () => {
    const result = buildQueryParams({
      planId: 123,
      count: 0,
      enabled: true,
      price: 45.99,
    });

    expect(result).toEqual({
      planId: '123',
      count: '0',
      enabled: 'true',
      price: '45.99',
    });
  });

  it('should handle mixed valid and invalid values', () => {
    const result = buildQueryParams({
      planId: 123,
      currency: 'ETH',
      id: undefined,
      discountCode: null,
      upgradeSubId: '',
      status: 'active',
    });

    expect(result).toEqual({
      planId: '123',
      currency: 'ETH',
      status: 'active',
    });
  });

  it('should return empty object when all values are filtered out', () => {
    const result = buildQueryParams({
      a: null,
      b: undefined,
      c: '',
    });

    expect(result).toEqual({});
  });

  it('should handle empty input object', () => {
    const result = buildQueryParams({});

    expect(result).toEqual({});
  });

  it('should preserve string "0" and string "false"', () => {
    const result = buildQueryParams({
      zero: '0',
      falsyString: 'false',
    });

    expect(result).toEqual({
      zero: '0',
      falsyString: 'false',
    });
  });

  it('should handle number 0 correctly (not filter it out)', () => {
    const result = buildQueryParams({
      count: 0,
      page: 1,
    });

    expect(result).toEqual({
      count: '0',
      page: '1',
    });
  });
});
