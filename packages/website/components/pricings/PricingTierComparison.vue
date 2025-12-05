<script setup lang="ts">
import type { AvailablePlans } from '@rotki/card-payment-common/schemas/plans';
import type { FeatureDescriptionMap, FeatureValue, MappedPlan, PlanBase } from '~/components/pricings/type';
import { get, set } from '@vueuse/shared';
import PricingTable from '~/components/pricings/PricingTable.vue';
import PricingTabs from '~/components/pricings/PricingTabs.vue';
import { isCustomPlan, isFreePlan } from '~/components/pricings/utils';
import { useFreePlanFeatures } from '~/composables/checkout/use-free-plan-features';
import { TIER_NAMES } from '~/types/pricing';
import { type PremiumTiersInfo, PricingPeriod } from '~/types/tiers';
import { formatCurrency, toTitleCase } from '~/utils/text';

const props = withDefaults(defineProps<{
  availablePlans?: AvailablePlans;
  tiersData?: PremiumTiersInfo;
  selectedPeriod: PricingPeriod;
  compact?: boolean;
}>(), {
  availablePlans: () => [],
  tiersData: () => [],
});

const { t } = useI18n({ useScope: 'global' });
const { isXlAndUp } = useBreakpoint();

const compactView = ref<boolean>(false);
const isYearly = computed<boolean>(() => props.selectedPeriod === PricingPeriod.YEARLY);

const featuresLabel = computed<string[]>(() => {
  const labelSet = new Set<string>();

  props.tiersData.forEach((item) => {
    if (!item.description) {
      return;
    }

    item.description.forEach((desc) => {
      labelSet.add(desc.label);
    });
  });

  return Array.from(labelSet);
});

const descriptionMap = computed<FeatureDescriptionMap>(() => {
  const map: FeatureDescriptionMap = new Map();

  props.tiersData.forEach((item) => {
    if (!item.description) {
      return;
    }

    const planDescriptions = new Map<string, FeatureValue>();
    item.description.forEach((desc) => {
      planDescriptions.set(desc.label, desc.value);
    });
    map.set(item.name, planDescriptions);
  });

  return map;
});

const regularPlans = computed<PlanBase[]>(() => {
  const yearly = get(isYearly);
  const plans: PlanBase[] = [];
  const available = props.availablePlans;

  available.forEach((availablePlan) => {
    const targetPlan = yearly ? availablePlan.yearlyPlan : availablePlan.monthlyPlan;
    if (!targetPlan) {
      return;
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
  });

  return plans;
});

const freePlanFeatures = useFreePlanFeatures();
const freeTier = computed<PlanBase>(() => ({
  name: TIER_NAMES.FREE,
  displayedName: t('pricing.plans.starter_plan'),
  mainPriceDisplay: t('pricing.free'),
  type: 'free',
  hidden: false,
  isMostPopular: false,
}));

const customTier = computed<PlanBase>(() => ({
  name: TIER_NAMES.CUSTOM,
  displayedName: t('pricing.plans.custom_plan'),
  mainPriceDisplay: t('pricing.contact_us'),
  type: 'custom',
  hidden: false,
  isMostPopular: false,
}));

const plans = computed<MappedPlan[]>(() => {
  const labels = get(featuresLabel);
  const descriptions = get(descriptionMap);
  const allPlans = [get(freeTier), ...get(regularPlans).filter(x => !x.hidden), get(customTier)];

  return allPlans.map(plan => ({
    ...plan,
    features: labels.map(label => getFeatureValue(plan, label, descriptions)),
  }));
});

const allowCompact = computed<boolean>(() => props.compact && get(featuresLabel).length > 0);

const displayedFeaturesLabel = computed<string[]>(() =>
  get(compactView) ? [get(featuresLabel)[0]] : get(featuresLabel),
);

function isFeatureFlag(label: string, descriptionMap: FeatureDescriptionMap): boolean {
  for (const [_planName, features] of descriptionMap) {
    const featureValue = features.get(label);
    if (typeof featureValue === 'boolean') {
      return true;
    }
  }
  return false;
}

function getFeatureValue(plan: PlanBase, label: string, descriptionMap: FeatureDescriptionMap): FeatureValue {
  if (isFreePlan(plan)) {
    // Use shared free plan features
    const feature = freePlanFeatures.find(f => f.label === label);
    return feature?.value;
  }

  if (isCustomPlan(plan)) {
    if (label.toLowerCase().includes('support')) {
      return t('pricing.custom_plan_bespoke_support');
    }
    if (isFeatureFlag(label, descriptionMap)) {
      return true;
    }

    return t('pricing.custom_plan_negotiable');
  }

  return descriptionMap.get(plan.name)?.get(label);
}

watch(allowCompact, (value) => {
  set(compactView, value);
}, { immediate: true });
</script>

<template>
  <ClientOnly>
    <PricingTable
      v-if="isXlAndUp"
      :plans="plans"
      :compact="compactView"
      :selected-period="selectedPeriod"
      :features-label="displayedFeaturesLabel"
    />
    <PricingTabs
      v-else
      :plans="plans"
      :compact="compactView"
      :selected-period="selectedPeriod"
      :features-label="displayedFeaturesLabel"
    />
    <div class="flex justify-center">
      <RuiButton
        v-if="allowCompact"
        color="primary"
        size="lg"
        @click="compactView = !compactView"
      >
        {{
          compactView
            ? t('pricing.see_all_features')
            : t('pricing.see_less_features')
        }}
      </RuiButton>
    </div>
  </ClientOnly>
</template>
