<script setup lang="ts">
import type { SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import PlanLine from '@rotki/checkout-ui/components/PlanLine.vue';
import { set } from '@vueuse/shared';
import ChangePlanDialog from '~/modules/checkout/components/plan/ChangePlanDialog.vue';

const {
  plan,
  crypto = false,
  warning = false,
  disabled = false,
  loading = false,
  upgrade = false,
} = defineProps<{
  plan: SelectedPlan;
  crypto?: boolean;
  warning?: boolean;
  disabled?: boolean;
  loading?: boolean;
  upgrade?: boolean;
}>();

const emit = defineEmits<{
  'plan-change': [plan: SelectedPlan];
}>();

const selection = ref<boolean>(false);

const { t } = useI18n({ useScope: 'global' });

// Starts on payment, which is today.
const startsAt = new Date();

function select(): void {
  set(selection, true);
}

function switchTo(selectedPlan: SelectedPlan): void {
  set(selection, false);
  emit('plan-change', selectedPlan);
}
</script>

<template>
  <div class="mb-4">
    <PlanLine
      :plan="plan"
      :upgrade="upgrade"
      :one-time="crypto"
      :starts-at="startsAt"
    >
      <template
        v-if="!upgrade"
        #action
      >
        <RuiButton
          :disabled="disabled"
          :loading="loading"
          color="primary"
          variant="outlined"
          size="sm"
          @click="select()"
        >
          {{ t('actions.change') }}
        </RuiButton>
      </template>
    </PlanLine>

    <ChangePlanDialog
      :crypto="crypto"
      :warning="warning"
      :visible="selection"
      @cancel="selection = false"
      @select="switchTo($event)"
    />
  </div>
</template>
