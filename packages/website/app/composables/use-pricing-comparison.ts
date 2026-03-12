import type { AvailablePlans } from '@rotki/card-payment-common/schemas/plans';
import type { MaybeRefOrGetter } from 'vue';
import type { FeatureDescriptionMap, FeatureValue, MappedPlan, PlanBase } from '~/components/pricings/type';
import { get, set } from '@vueuse/shared';
import { isCustomPlan, isFreePlan } from '~/components/pricings/utils';
import { useFreePlanFeatures } from '~/modules/checkout/composables/use-free-plan-features';
import { TIER_NAMES } from '~/types/pricing';
import { type PremiumTiersInfo, PricingPeriod } from '~/types/tiers';
import { formatCurrency, toTitleCase } from '~/utils/text';

export interface TiersInfo {
  labels: string[];
  descriptions: FeatureDescriptionMap;
  featureFlags: Set<string>;
}

/**
 * Single pass over tiersData to extract:
 * - labels: ordered list of unique feature labels
 * - descriptions: plan name → (label → value) map
 * - featureFlags: set of labels where all non-undefined values are boolean
 */
export function parseTiersInfo(tiersData: PremiumTiersInfo): TiersInfo {
  const labelSet = new Set<string>();
  const descriptions: FeatureDescriptionMap = new Map();

  for (const item of tiersData) {
    if (!item.description) {
      continue;
    }

    const planDescriptions = new Map<string, FeatureValue>();
    for (const desc of item.description) {
      labelSet.add(desc.label);
      planDescriptions.set(desc.label, desc.value);
    }
    descriptions.set(item.name, planDescriptions);
  }

  const featureFlags = new Set<string>();
  for (const label of labelSet) {
    let allBoolean = true;
    let hasValue = false;
    for (const [, features] of descriptions) {
      const value = features.get(label);
      if (value === undefined) {
        continue;
      }
      hasValue = true;
      if (typeof value !== 'boolean') {
        allBoolean = false;
        break;
      }
    }
    if (hasValue && allBoolean) {
      featureFlags.add(label);
    }
  }

  return { labels: Array.from(labelSet), descriptions, featureFlags };
}

/**
 * Resolve a single feature value for a plan/label combination.
 * Pure function — all dependencies passed as arguments.
 */
export function resolveFeatureValue(
  plan: PlanBase,
  label: string,
  descriptions: FeatureDescriptionMap,
  featureFlags: Set<string>,
  freeFeatures: Map<string, FeatureValue>,
  customPlanLabels: { support: string; negotiable: string },
): FeatureValue {
  if (isFreePlan(plan)) {
    const value = freeFeatures.get(label);
    if (value !== undefined) {
      return value;
    }
    return featureFlags.has(label) ? false : undefined;
  }

  if (isCustomPlan(plan)) {
    if (featureFlags.has(label)) {
      return true;
    }
    return label.toLowerCase().includes('support')
      ? customPlanLabels.support
      : customPlanLabels.negotiable;
  }

  return descriptions.get(plan.name)?.get(label);
}

interface UsePricingComparisonOptions {
  availablePlans: MaybeRefOrGetter<AvailablePlans>;
  tiersData: MaybeRefOrGetter<PremiumTiersInfo>;
  selectedPeriod: MaybeRefOrGetter<PricingPeriod>;
  compact: MaybeRefOrGetter<boolean | undefined>;
}

export function usePricingComparison(options: UsePricingComparisonOptions) {
  const { t } = useI18n({ useScope: 'global' });
  const rawFreePlanFeatures = useFreePlanFeatures();

  const compactView = ref<boolean>(false);

  const freePlanFeaturesMap = computed<Map<string, FeatureValue>>(() => {
    const map = new Map<string, FeatureValue>();
    for (const feature of rawFreePlanFeatures) {
      map.set(feature.label, feature.value);
    }
    return map;
  });

  const isYearly = computed<boolean>(() => toValue(options.selectedPeriod) === PricingPeriod.YEARLY);

  const tiersInfo = computed<TiersInfo>(() => parseTiersInfo(toValue(options.tiersData)));

  const regularPlans = computed<PlanBase[]>(() => {
    const yearly = get(isYearly);
    const plans: PlanBase[] = [];
    for (const availablePlan of toValue(options.availablePlans)) {
      const targetPlan = yearly ? availablePlan.yearlyPlan : availablePlan.monthlyPlan;
      if (!targetPlan) {
        continue;
      }

      const price = Number.parseFloat(targetPlan.price);
      const formattedPrice = formatCurrency(price);

      plans.push({
        id: targetPlan.planId,
        name: availablePlan.tierName,
        displayedName: t('pricing.plans.plan', { plan: toTitleCase(availablePlan.tierName) }),
        mainPriceDisplay: yearly ? `${formatCurrency(price / 12)}€` : `${formattedPrice}€`,
        secondaryPriceDisplay: yearly
          ? t('pricing.billed_annually', { price: formattedPrice })
          : t('pricing.billed_monthly'),
        type: 'regular',
        hidden: availablePlan.isCustom || false,
        isMostPopular: availablePlan.isMostPopular || false,
      });
    }

    return plans;
  });

  const plans = computed<MappedPlan[]>(() => {
    const { labels, descriptions, featureFlags } = get(tiersInfo);
    const freeFeatures = get(freePlanFeaturesMap);
    const customPlanLabels = {
      support: t('pricing.custom_plan_bespoke_support'),
      negotiable: t('pricing.custom_plan_negotiable'),
    };

    const allPlans: PlanBase[] = [
      {
        name: TIER_NAMES.FREE,
        displayedName: t('pricing.plans.starter_plan'),
        mainPriceDisplay: t('pricing.free'),
        type: 'free',
        hidden: false,
        isMostPopular: false,
      },
      ...get(regularPlans).filter(x => !x.hidden),
      {
        name: TIER_NAMES.CUSTOM,
        displayedName: t('pricing.plans.custom_plan'),
        mainPriceDisplay: t('pricing.contact_us'),
        type: 'custom',
        hidden: false,
        isMostPopular: false,
      },
    ];

    return allPlans.map(plan => ({
      ...plan,
      features: labels.map(label =>
        resolveFeatureValue(plan, label, descriptions, featureFlags, freeFeatures, customPlanLabels),
      ),
    }));
  });

  const allowCompact = computed<boolean>(() => (toValue(options.compact) ?? false) && get(tiersInfo).labels.length > 0);

  const displayedFeaturesLabel = computed<string[]>(() => {
    const { labels } = get(tiersInfo);
    if (get(compactView)) {
      const firstLabel = labels[0];
      return firstLabel ? [firstLabel] : [];
    }
    return labels;
  });

  watch(allowCompact, (value) => {
    set(compactView, value);
  }, { immediate: true });

  return {
    allowCompact,
    compactView,
    displayedFeaturesLabel,
    plans,
  };
}
