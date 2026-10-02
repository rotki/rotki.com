import type { ComputedRef } from 'vue';
import type { PremiumTierInfo, PremiumTiersInfo } from '~/types/tiers';
import { get } from '@vueuse/shared';
import { builtTiersInfo, usePremiumTiersInfo } from '~/composables/tiers/use-premium-tiers-info';

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

/** Free tier history and PnL limit enforced by the rotki app itself (`constants/limits.py`). */
const FREE_EVENTS_LIMIT = 1000;

const numberFormat = new Intl.NumberFormat('en-US');

function readLimit(tier: PremiumTierInfo | undefined, key: string): number | undefined {
  const value = tier?.limits[key];
  return typeof value === 'number' ? value : undefined;
}

function toTierLimits(tier: PremiumTierInfo | undefined, fallback: PremiumTierInfo | undefined): TierLimits {
  const limit = (key: string): number => readLimit(tier, key) ?? readLimit(fallback, key) ?? 0;
  return {
    events: numberFormat.format(limit('historyEventsLimit')),
    pnlEvents: numberFormat.format(limit('pnlEventsLimit')),
    ethStaked: numberFormat.format(limit('ethStakedLimit')),
    backup: `${numberFormat.format(limit('maxBackupSizeMb'))} MB`,
    devices: numberFormat.format(limit('limitOfDevices')),
  };
}

function findTier(tiers: PremiumTiersInfo, name: PaidTier): PremiumTierInfo | undefined {
  return tiers.find(tier => tier.name.toLowerCase() === name);
}

/**
 * Formats the limits of each paid tier, falling back per tier and per limit to the tier
 * details the site was built with when the live response is partial or missing a tier.
 *
 * @param tiers - the live tier details
 * @param builtTiers - the tier details read when the site was built
 */
export function buildPlanLimits(tiers: PremiumTiersInfo, builtTiers: PremiumTiersInfo): PlanLimits {
  const forTier = (name: PaidTier): TierLimits => toTierLimits(findTier(tiers, name), findTier(builtTiers, name));

  return {
    free: numberFormat.format(FREE_EVENTS_LIMIT),
    supporter: forTier('supporter'),
    basic: forTier('basic'),
    advanced: forTier('advanced'),
  };
}

/**
 * Plan limits for marketing copy, read from the live tiers API with a build-time fallback,
 * so the numbers in sentences match the pricing table instead of drifting from it.
 */
export function usePlanLimits(): ComputedRef<PlanLimits> {
  const { tiersInformation } = usePremiumTiersInfo();
  const builtTiers = builtTiersInfo();

  return computed<PlanLimits>(() => buildPlanLimits(get(tiersInformation), builtTiers));
}
