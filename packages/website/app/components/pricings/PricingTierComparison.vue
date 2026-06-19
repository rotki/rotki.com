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

const { plans, displayedFeaturesLabel, modelCompact, allowCompact } = usePricingComparison({
  availablePlans: () => availablePlans,
  tiersData: () => tiersData,
  selectedPeriod: () => selectedPeriod,
  compact: () => compact,
});
</script>

<template>
  <div class="min-h-[520px] md:min-h-[560px] xl:min-h-[570px]">
    <div class="hidden xl:block">
      <PricingTable
        :plans="plans"
        :compact="modelCompact"
        :features-label="displayedFeaturesLabel"
      />
    </div>
    <div class="block xl:hidden">
      <PricingTabs
        :plans="plans"
        :features-label="displayedFeaturesLabel"
      />
    </div>
    <div class="flex justify-center">
      <RuiButton
        v-if="allowCompact"
        color="primary"
        size="lg"
        @click="modelCompact = !modelCompact"
      >
        {{
          modelCompact
            ? t('pricing.see_all_features')
            : t('pricing.see_less_features')
        }}
      </RuiButton>
    </div>
  </div>
</template>
