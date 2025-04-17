<script setup lang="ts">
import type { PlanParams } from '~/composables/plan';
import type { SelectedPlan } from '~/types';
import { get, set } from '@vueuse/core';
import { getPlanNameFor } from '~/utils/plans';

const props = withDefaults(
  defineProps<{
    plan: SelectedPlan;
    crypto?: boolean;
    warning?: boolean;
    disabled?: boolean;
    nextPayment: number;
  }>(),
  {
    crypto: false,
    warning: false,
  },
);

const { plan, nextPayment } = toRefs(props);
const router = useRouter();

const selection = ref(false);

const name = computed(() => {
  const selectedPlan = get(plan);
  return getPlanNameFor(selectedPlan);
});

const nextPaymentDate = computed(() => {
  const date = new Date(get(nextPayment) * 1000);
  return date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' });
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

const { t } = useI18n({ useScope: 'global' });
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
        <div class="text-xs text-rui-text-secondary italic">
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
          :crypto="crypto"
          :warning="warning"
          :visible="selection"
          @cancel="selection = false"
          @select="switchTo($event)"
        />
      </div>
    </div>
  </RuiCard>
</template>
