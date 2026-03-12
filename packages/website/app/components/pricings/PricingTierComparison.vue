<script setup lang="ts">
import type { AvailablePlans } from '@rotki/card-payment-common/schemas/plans';
import type { PremiumTiersInfo, PricingPeriod } from '~/types/tiers';
import PricingTable from '~/components/pricings/PricingTable.vue';
import PricingTabs from '~/components/pricings/PricingTabs.vue';
import { usePricingComparison } from '~/composables/use-pricing-comparison';

const {
  availablePlans = [],
  tiersData = [],
  selectedPeriod,
  compact,
} = defineProps<{
  availablePlans?: AvailablePlans;
  tiersData?: PremiumTiersInfo;
  selectedPeriod: PricingPeriod;
  compact?: boolean;
}>();

const { t } = useI18n({ useScope: 'global' });
const { isXlAndUp } = useBreakpoint();

const { plans, displayedFeaturesLabel, compactView, allowCompact } = usePricingComparison({
  availablePlans: () => availablePlans,
  tiersData: () => tiersData,
  selectedPeriod: () => selectedPeriod,
  compact: () => compact,
});
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
