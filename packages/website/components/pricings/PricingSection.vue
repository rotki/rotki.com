<script setup lang="ts">
import { storeToRefs } from 'pinia';
import PricingPeriodTab from '~/components/pricings/PricingPeriodTab.vue';
import PricingTierComparison from '~/components/pricings/PricingTierComparison.vue';
import { useTiersStore } from '~/store/tiers';
import { PricingPeriod } from '~/types/tiers';

defineProps<{
  compact?: boolean;
}>();

const selectedPricingPeriod = ref<PricingPeriod>(PricingPeriod.MONTHLY);

const store = useTiersStore();
const { tiersInformation, availablePlans } = storeToRefs(store);

onBeforeMount(async () => {
  await Promise.all([
    store.getPremiumTiersInfo(),
    store.getAvailablePlans(),
  ]);
});
</script>

<template>
  <div class="container flex flex-col gap-12 pb-10 md:pb-20">
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
