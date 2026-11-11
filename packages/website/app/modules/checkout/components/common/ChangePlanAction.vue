<script setup lang="ts">
import type { SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { set } from '@vueuse/shared';
import ChangePlanDialog from '~/modules/checkout/components/plan/ChangePlanDialog.vue';

const {
  crypto = false,
  warning = false,
  disabled = false,
  loading = false,
} = defineProps<{
  crypto?: boolean;
  /** Warns that switching after a crypto payment was sent can break the activation. */
  warning?: boolean;
  disabled?: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  select: [plan: SelectedPlan];
}>();

const { t } = useI18n({ useScope: 'global' });

const open = ref<boolean>(false);

function switchTo(plan: SelectedPlan): void {
  set(open, false);
  emit('select', plan);
}
</script>

<template>
  <div>
    <RuiButton
      :disabled="disabled"
      :loading="loading"
      color="primary"
      variant="outlined"
      size="sm"
      data-testid="change-plan"
      @click="open = true"
    >
      {{ t('actions.change') }}
    </RuiButton>
    <ChangePlanDialog
      :crypto="crypto"
      :warning="warning"
      :visible="open"
      @cancel="open = false"
      @select="switchTo($event)"
    />
  </div>
</template>
