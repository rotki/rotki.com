<script setup lang="ts">
import type { AvailablePlan, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import PlanOptions from '@rotki/checkout-ui/components/PlanOptions.vue';
import { useCheckoutMessages } from '@rotki/checkout-ui/composables/checkout-messages';
import { RuiButton } from '@rotki/ui-library';
import { set } from '@vueuse/core';
import { ref } from 'vue';
import BaseDialog from './BaseDialog.vue';

const { plans, currentPlanId, disabled = false } = defineProps<{
  plans: AvailablePlan[];
  currentPlanId: number;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  select: [plan: SelectedPlan];
}>();

const t = useCheckoutMessages();

const open = ref<boolean>(false);

function choose(plan: SelectedPlan): void {
  set(open, false);
  emit('select', plan);
}
</script>

<template>
  <div>
    <RuiButton
      :disabled="disabled"
      color="primary"
      variant="outlined"
      size="sm"
      data-testid="change-plan"
      @click="open = true"
    >
      {{ t('checkout.change_plan.action') }}
    </RuiButton>
    <BaseDialog
      v-model:open="open"
      :title="t('checkout.change_plan.title')"
    >
      <PlanOptions
        :plans="plans"
        :current-plan-id="currentPlanId"
        @select="choose($event)"
      />
      <template #actions>
        <RuiButton
          variant="outlined"
          color="primary"
          @click="open = false"
        >
          {{ t('checkout.change_plan.cancel') }}
        </RuiButton>
      </template>
    </BaseDialog>
  </div>
</template>
