import type { ComputedRef } from 'vue';
import type { PremiumTierInfo, PremiumTiersInfo } from '~/types/tiers';
import { get } from '@vueuse/shared';
import { usePremiumTiersInfo } from '~/composables/tiers/use-premium-tiers-info';

type PaidTier = 'supporter' | 'basic' | 'advanced';

interface TierLimits {
  /** History events the tier can see and process, e.g. `30,000`. */
  events: string;
  /** Events a profit and loss report can include. */
  pnlEvents: string;
  /** ETH that can be tracked in validators, e.g. `128`. */
  ethStaked: string;
  /** Encrypted backup storage, e.g. `150 MB`. */
  backup: string;
  /** Devices the premium account can be used on. */
  devices: string;
}

export type PlanLimits = Record<PaidTier, TierLimits> & {
  /** Events processed by the free app; a client-side constant, not part of the tiers API. */
  free: string;
};

/*
 * What `/webapi/2/tiers/info` returned on 2026-10-01. The prerendered HTML is built from
 * these, so crawlers and visitors without JavaScript still see real numbers; the browser
 * swaps in the live values once the tiers request resolves.
 */
const FALLBACK_LIMITS: Record<PaidTier, Record<string, number>> = {
  supporter: { historyEventsLimit: 3000, pnlEventsLimit: 3000, ethStakedLimit: 0, maxBackupSizeMb: 0, limitOfDevices: 1 },
  basic: { historyEventsLimit: 30000, pnlEventsLimit: 30000, ethStakedLimit: 128, maxBackupSizeMb: 150, limitOfDevices: 2 },
  advanced: { historyEventsLimit: 100000, pnlEventsLimit: 100000, ethStakedLimit: 384, maxBackupSizeMb: 600, limitOfDevices: 4 },
};

/** Free tier history and PnL limit enforced by the rotki app itself (`constants/limits.py`). */
const FREE_EVENTS_LIMIT = 1000;

const numberFormat = new Intl.NumberFormat('en-US');

function readLimit(tier: PremiumTierInfo | undefined, key: string, fallback: number): number {
  const value = tier?.limits[key];
  return typeof value === 'number' ? value : fallback;
}

function toTierLimits(tier: PremiumTierInfo | undefined, fallback: Record<string, number>): TierLimits {
  const limit = (key: string): number => readLimit(tier, key, fallback[key] ?? 0);
  return {
    events: numberFormat.format(limit('historyEventsLimit')),
    pnlEvents: numberFormat.format(limit('pnlEventsLimit')),
    ethStaked: numberFormat.format(limit('ethStakedLimit')),
    backup: `${numberFormat.format(limit('maxBackupSizeMb'))} MB`,
    devices: numberFormat.format(limit('limitOfDevices')),
  };
}

/**
 * Formats the limits of each paid tier, falling back per tier and per limit
 * when the API response is empty, partial or missing a tier.
 */
export function buildPlanLimits(tiers: PremiumTiersInfo): PlanLimits {
  const byName = (name: PaidTier): PremiumTierInfo | undefined =>
    tiers.find(tier => tier.name.toLowerCase() === name);

  return {
    free: numberFormat.format(FREE_EVENTS_LIMIT),
    supporter: toTierLimits(byName('supporter'), FALLBACK_LIMITS.supporter),
    basic: toTierLimits(byName('basic'), FALLBACK_LIMITS.basic),
    advanced: toTierLimits(byName('advanced'), FALLBACK_LIMITS.advanced),
  };
}

/**
 * Plan limits for marketing copy, read from the live tiers API with a build-time fallback,
 * so the numbers in sentences match the pricing table instead of drifting from it.
 */
export function usePlanLimits(): ComputedRef<PlanLimits> {
  const { tiersInformation } = usePremiumTiersInfo();

  return computed<PlanLimits>(() => buildPlanLimits(get(tiersInformation)));
}
