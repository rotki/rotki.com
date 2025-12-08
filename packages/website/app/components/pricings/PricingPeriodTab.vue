<script setup lang="ts">
import { PricingPeriod } from '~/types/tiers';

const model = defineModel<PricingPeriod>({ required: true });

const props = defineProps<{
  data: { monthlyPlan: { price: string } | null; yearlyPlan: { price: string } | null }[];
}>();

const maxSavedAnnually = computed(() => {
  if (props.data.length === 0)
    return 0;

  return Math.max(
    ...props.data.map((item) => {
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

const { t } = useI18n({ useScope: 'global' });

const tabs = [
  { value: PricingPeriod.MONTHLY, label: t('home.plans.names.monthly_billing') },
  { value: PricingPeriod.YEARLY, label: t('home.plans.names.yearly_billing') },
];
</script>

<template>
  <div class="flex relative">
    <RuiTabs
      v-model="model"
      class="border border-rui-gray-200 bg-rui-grey-200 rounded-md [&>div]:p-1"
    >
      <RuiTab
        v-for="tab in tabs"
        :key="tab.value"
        :value="tab.value"
        class="bg-transparent rounded h-8 min-h-[2rem]"
        active-class="!bg-white shadow rounded after:hidden !text-black"
      >
        {{ tab.label }}
      </RuiTab>
    </RuiTabs>

    <div
      v-if="maxSavedAnnually"
      class="flex items-start gap-2 text-rui-primary font-medium whitespace-nowrap -mt-8 -ml-4 relative z-1"
    >
      <img
        :alt="t('pricing.max_saved_annually', { months: maxSavedAnnually })"
        class="w-14 mt-3"
        src="/img/pricing-arrow.svg"
        width="56"
        height="56"
        loading="lazy"
      />
      {{ t('pricing.max_saved_annually', { months: maxSavedAnnually }) }}
    </div>
  </div>
</template>
