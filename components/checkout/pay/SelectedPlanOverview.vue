<script setup lang="ts">
import type { PlanParams } from '~/composables/plan';
import type { SelectedPlan } from '~/types';
import { get, set } from '@vueuse/core';
import { formatDate } from '~/utils/date';
import { getPlanNameFor } from '~/utils/plans';

const props = withDefaults(
  defineProps<{
    plan: SelectedPlan;
    warning?: boolean;
    disabled?: boolean;
    nextPayment?: number;
  }>(),
  {
    warning: false,
  },
);

const { plan, nextPayment } = toRefs(props);
const router = useRouter();

const selection = ref(false);

const { t } = useI18n({ useScope: 'global' });

const name = computed<string>(() => {
  const selectedPlan = get(plan);
  return `${getPlanNameFor(t, selectedPlan)} - € ${selectedPlan.price.toFixed(2)}`;
});

const nextPaymentDate = computed(() => {
  const next = get(nextPayment);
  if (!next) {
    return undefined;
  }
  const date = new Date(next * 1000);
  return formatDate(date);
});

function select() {
  set(selection, true);
}

function switchTo(data: PlanParams & { planId: number }) {
  set(selection, false);
  const currentRoute = get(router.currentRoute);

  navigateTo({
    path: currentRoute.path,
    query: {
      ...currentRoute.query,
      ...data,
    },
  });
}
</script>

<template>
  <RuiCard class="h-auto mt-6">
    <div class="text-rui-text text-h6">
      {{ t('home.plans.tiers.step_3.chose') }}
    </div>
    <div class="pt-1 flex items-center justify-between gap-4">
      <div>
        <div class="text-body-1 font-bold mr-1 text-rui-text-secondary">
          {{ name }}
        </div>
        <div
          v-if="nextPaymentDate"
          class="text-xs text-rui-text-secondary italic"
        >
          {{
            t('selected_plan_overview.next_payment', {
              date: nextPaymentDate,
            })
          }}
        </div>
      </div>

      <div>
        <RuiButton
          :disabled="disabled"
          color="primary"
          variant="text"
          @click="select()"
        >
          {{ t('actions.change') }}
        </RuiButton>
        <ChangePlanDialog
          :warning="warning"
          :visible="selection"
          @cancel="selection = false"
          @select="switchTo($event)"
        />
      </div>
    </div>
  </RuiCard>
</template>
