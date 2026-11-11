<script setup lang="ts">
import type { PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { needsVatWarning } from '@rotki/card-payment-common/utils/checkout';
import { renewalDateFrom } from '@rotki/card-payment-common/utils/date';
import OrderSummary from '@rotki/checkout-ui/components/OrderSummary.vue';
import VatNotice from '@rotki/checkout-ui/components/VatNotice.vue';
import { get } from '@vueuse/shared';
import { useAppConfig } from '~/composables/use-app-config';
import ChangePlanAction from '~/modules/checkout/components/common/ChangePlanAction.vue';
import { useMainStore } from '~/store';

const discountCodeInput = defineModel<string>('discountCode', { default: '' });

const {
  selectedPlan,
  breakdown,
  upgradeSubId,
  renewing = false,
  isCrypto = false,
  warning = false,
  loading = false,
  disabled = false,
} = defineProps<{
  selectedPlan?: SelectedPlan;
  breakdown?: PaymentBreakdownResponse;
  upgradeSubId?: string;
  /** Pays the next period of an existing subscription, whose dates are not known here. */
  renewing?: boolean;
  isCrypto?: boolean;
  /** Warns in the plan dialog that switching after a crypto payment was sent can break the activation. */
  warning?: boolean;
  loading?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  'plan-change': [plan: SelectedPlan];
  'apply-discount': [];
}>();

const { account } = storeToRefs(useMainStore());

// Offered next to the discount field while no code is applied.
const { activeCampaign } = useAppConfig();

// A new subscription renews one billing period from today; an existing one keeps its own dates.
const renewsAt = computed<Date | undefined>(() => {
  if (!selectedPlan || upgradeSubId || renewing)
    return undefined;
  return renewalDateFrom(selectedPlan.durationInMonths);
});

const showVatWarning = computed<boolean>(() => {
  const acc = get(account);
  return needsVatWarning(acc?.vatIdStatus, acc?.address.country);
});
</script>

<template>
  <OrderSummary
    v-if="selectedPlan"
    v-model:code="discountCodeInput"
    :plan="selectedPlan"
    :breakdown="breakdown"
    :upgrade="!!upgradeSubId"
    :one-time="isCrypto"
    :loading="loading"
    :disabled="disabled"
    :campaign="activeCampaign"
    :renews-at="renewsAt"
    @apply="emit('apply-discount')"
  >
    <template
      v-if="!upgradeSubId"
      #plan-action
    >
      <ChangePlanAction
        :warning="warning"
        :disabled="disabled"
        :loading="loading"
        @select="emit('plan-change', $event)"
      />
    </template>
    <template
      v-if="showVatWarning"
      #notice
    >
      <VatNotice billing-href="/home/billing" />
    </template>
  </OrderSummary>
</template>
