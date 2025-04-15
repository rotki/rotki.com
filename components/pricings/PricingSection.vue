<script setup lang="ts">
import PricingTierComparison from '~/components/pricings/PricingTierComparison.vue';
import { useTiersStore } from '~/store/tiers';
import { PricingPeriod } from '~/types/tiers';

defineProps<{
  compact?: boolean;
}>();

const selectedPricingPeriod = ref(PricingPeriod.MONTHLY);

const store = useTiersStore();
const { tiersInformation: data } = storeToRefs(store);

onBeforeMount(async () => {
  await store.getPremiumTiersInfo();
});
</script>

<template>
  <div class="container flex flex-col gap-12 pb-10 md:pb-20">
    <PricingPeriodTab
      v-model="selectedPricingPeriod"
      :data="data"
    />
    <PricingTierComparison
      :compact="compact"
      :selected-period="selectedPricingPeriod"
      :tiers-data="data"
    />
  </div>
</template>
