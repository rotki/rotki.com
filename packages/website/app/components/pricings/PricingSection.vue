<script setup lang="ts">
import PricingPeriodTab from '~/components/pricings/PricingPeriodTab.vue';
import PricingTierComparison from '~/components/pricings/PricingTierComparison.vue';
import { useAvailablePlans } from '~/composables/tiers/use-available-plans';
import { usePremiumTiersInfo } from '~/composables/tiers/use-premium-tiers-info';
import { PricingPeriod } from '~/types/tiers';

defineProps<{
  compact?: boolean;
}>();

const selectedPricingPeriod = ref<PricingPeriod>(PricingPeriod.MONTHLY);

const { availablePlans } = useAvailablePlans();
const { tiersInformation } = usePremiumTiersInfo();
</script>

<template>
  <div
    data-cy="pricing-section"
    class="container flex flex-col gap-12 pb-10 md:pb-20"
  >
    <PricingPeriodTab
      v-model="selectedPricingPeriod"
      :data="availablePlans"
    />
    <PricingTierComparison
      :compact="compact"
      :selected-period="selectedPricingPeriod"
      :available-plans="availablePlans"
      :tiers-data="tiersInformation"
    />
  </div>
</template>
