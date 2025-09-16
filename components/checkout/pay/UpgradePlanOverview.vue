<script setup lang="ts">
import type { SelectedPlan } from '~/types';
import { get } from '@vueuse/core';
import { getPlanNameFor } from '~/utils/plans';

const props = defineProps<{
  plan: SelectedPlan;
}>();

const { plan } = toRefs(props);

const { t } = useI18n({ useScope: 'global' });

const name = computed<string>(() => {
  const selectedPlan = get(plan);
  return `${getPlanNameFor(t, selectedPlan)} - € ${selectedPlan.price.toFixed(2)}`;
});
</script>

<template>
  <RuiCard class="h-auto mt-6">
    <div class="text-rui-text text-h6">
      {{ t('home.plans.tiers.step_3.upgrade_to_plan') }}
    </div>
    <div class="pt-1 flex items-center justify-between gap-4">
      <div>
        <div class="text-body-1 font-bold mr-1 text-rui-text-secondary">
          {{ name }}
        </div>
        <div class="text-xs text-rui-text-secondary">
          {{ t('home.plans.tiers.step_3.upgrade_plan_description') }}
        </div>
      </div>
    </div>
  </RuiCard>
</template>
