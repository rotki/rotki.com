<script setup lang="ts">
import { get } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';

const { t } = useI18n();

const store = useMainStore();
const { plans } = storeToRefs(store);

onMounted(async () => {
  await store.getPlans();
});

const startingPrice = computed(() => {
  const plansVal = get(plans);
  if (!plansVal || plansVal.length === 0)
    return '';

  return `${plansVal.find(item => item.months === 1)?.priceFiat || ''}€`;
});
</script>

<template>
  <PlanBox
    :action="t('actions.get_premium_plan')"
    url="/products/"
    recommended
  >
    <template #title>
      {{ t('home.plans.details.premium.title') }}
    </template>
    <template #price>
      <div v-if="plans">
        {{ startingPrice }}
      </div>
      <RuiSkeletonLoader
        v-else
        class="h-[2.625rem]"
      />
    </template>
    {{ t('home.plans.details.premium.subtitle') }}
  </PlanBox>
</template>
