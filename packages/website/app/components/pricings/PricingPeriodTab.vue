<script setup lang="ts">
import { PricingPeriod } from '~/types/tiers';

const model = defineModel<PricingPeriod>({ required: true });

const { data } = defineProps<{
  data: { monthlyPlan: { price: string } | null; yearlyPlan: { price: string } | null }[];
}>();

const { t } = useI18n({ useScope: 'global' });

const maxSavedAnnually = computed<number>(() => {
  if (data.length === 0)
    return 0;

  return Math.max(
    ...data.map((item) => {
      if (!item.monthlyPlan || !item.yearlyPlan) {
        return 0;
      }
      const monthlyPrice = parseFloat(item.monthlyPlan.price);
      const yearlyPrice = parseFloat(item.yearlyPlan.price);

      if (!monthlyPrice || !yearlyPrice)
        return 0;

      const monthlyTotal = monthlyPrice * 12;
      const saved = monthlyTotal - yearlyPrice;
      const monthsSaved = saved / monthlyPrice;

      return Math.floor(monthsSaved); // Round down to nearest integer
    }),
  );
});

const tabs = [
  { value: PricingPeriod.MONTHLY, label: t('home.plans.names.monthly_billing') },
  { value: PricingPeriod.YEARLY, label: t('home.plans.names.yearly_billing') },
];
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center gap-2 sm:gap-0 relative">
    <!-- On phones the savings note goes under the toggle; beside it, it ran off the screen -->
    <RuiTabs
      v-model="model"
      variant="segmented"
    >
      <RuiTab
        v-for="tab in tabs"
        :key="tab.value"
        :value="tab.value"
      >
        {{ tab.label }}
      </RuiTab>
    </RuiTabs>

    <div
      v-if="maxSavedAnnually > 0"
      class="flex items-start gap-2 text-rui-primary text-body-2 sm:text-body-1 font-medium min-w-0 sm:whitespace-nowrap sm:-mt-8 sm:ml-1 relative z-1"
    >
      <img
        alt=""
        class="hidden sm:block w-14 h-14 mt-3"
        src="/img/pricing-arrow.svg"
        width="56"
        height="56"
      />
      {{ t('pricing.max_saved_annually', { months: maxSavedAnnually }) }}
    </div>
  </div>
</template>
