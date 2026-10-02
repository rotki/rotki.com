import type { PremiumTierInfo } from '~/types/tiers';
import { describe, expect, it } from 'vitest';
import { buildPlanLimits } from '~/composables/tiers/use-plan-limits';

function tier(name: string, limits: Record<string, number | boolean>): PremiumTierInfo {
  return {
    name,
    limits,
    monthlyPlan: { price: '10.00', id: 1 },
    yearlyPlan: { price: '100.00', id: 2 },
  };
}

/** Tier details as a build would have read them from the API. */
const builtTiers = [
  tier('Supporter', { historyEventsLimit: 3000, pnlEventsLimit: 3000, ethStakedLimit: 0, maxBackupSizeMb: 0, limitOfDevices: 1 }),
  tier('Basic', { historyEventsLimit: 30000, pnlEventsLimit: 30000, ethStakedLimit: 128, maxBackupSizeMb: 150, limitOfDevices: 2 }),
  tier('Advanced', { historyEventsLimit: 100000, pnlEventsLimit: 100000, ethStakedLimit: 384, maxBackupSizeMb: 600, limitOfDevices: 4 }),
];

describe('buildPlanLimits', () => {
  it('uses the tier details the site was built with while the live ones have not loaded', () => {
    const limits = buildPlanLimits([], builtTiers);

    expect(limits.free).toBe('1,000');
    expect(limits.supporter.events).toBe('3,000');
    expect(limits.basic).toEqual({ events: '30,000', pnlEvents: '30,000', ethStaked: '128', backup: '150 MB', devices: '2' });
    expect(limits.advanced.ethStaked).toBe('384');
  });

  it('prefers the live values and matches tier names case-insensitively', () => {
    const limits = buildPlanLimits([
      tier('Basic', { historyEventsLimit: 50000, pnlEventsLimit: 40000, ethStakedLimit: 256, maxBackupSizeMb: 300, limitOfDevices: 3 }),
    ], builtTiers);

    expect(limits.basic).toEqual({ events: '50,000', pnlEvents: '40,000', ethStaked: '256', backup: '300 MB', devices: '3' });
  });

  it('falls back per limit when a live tier omits a value or sends a non-number', () => {
    const limits = buildPlanLimits([
      tier('Advanced', { historyEventsLimit: 200000, ethStakedLimit: true }),
    ], builtTiers);

    expect(limits.advanced.events).toBe('200,000');
    expect(limits.advanced.ethStaked).toBe('384');
    expect(limits.advanced.backup).toBe('600 MB');
  });

  it('shows zero for a limit neither the live nor the built tiers have', () => {
    const limits = buildPlanLimits([], []);

    expect(limits.basic.events).toBe('0');
    expect(limits.free).toBe('1,000');
  });
});
