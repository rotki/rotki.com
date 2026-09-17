import { describe, expect, it } from 'vitest';
import { formatCampaignLastDay } from './campaign';

describe('formatCampaignLastDay', () => {
  it('should name the day before an end at midnight UTC', () => {
    expect(formatCampaignLastDay('2026-09-30T00:00:00Z')).toBe('September 29');
  });

  it('should name the same day for an end during the day', () => {
    expect(formatCampaignLastDay('2026-09-30T23:59:59Z')).toBe('September 30');
  });

  it('should use UTC for ends given with an offset', () => {
    expect(formatCampaignLastDay('2026-09-30T01:00:00+02:00')).toBe('September 29');
  });

  it('should return undefined without an end', () => {
    expect(formatCampaignLastDay(undefined)).toBeUndefined();
    expect(formatCampaignLastDay('')).toBeUndefined();
  });

  it('should return undefined for an unparsable end', () => {
    expect(formatCampaignLastDay('not a date')).toBeUndefined();
  });
});
