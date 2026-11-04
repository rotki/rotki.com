<script setup lang="ts">
import type { PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { VatIdStatus } from '@rotki/card-payment-common/schemas/account';
import OrderSummary from '@rotki/checkout-ui/components/OrderSummary.vue';
import { get } from '@vueuse/shared';
import { useAppConfig } from '~/composables/use-app-config';
import ChangePlanAction from '~/modules/checkout/components/common/ChangePlanAction.vue';
import { useMainStore } from '~/store';

const discountCodeInput = defineModel<string>('discountCode', { default: '' });

const {
  selectedPlan,
  breakdown,
  upgradeSubId,
  isCrypto = false,
  warning = false,
  loading = false,
  disabled = false,
} = defineProps<{
  selectedPlan?: SelectedPlan;
  breakdown?: PaymentBreakdownResponse;
  upgradeSubId?: string;
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

const { t } = useI18n({ useScope: 'global' });

const { account } = storeToRefs(useMainStore());

// Offered next to the discount field while no code is applied.
const { activeCampaign } = useAppConfig();

// A new subscription renews one billing period from today.
const renewsAt = computed<Date | undefined>(() => {
  if (!selectedPlan)
    return undefined;
  const renewal = new Date();
  renewal.setMonth(renewal.getMonth() + selectedPlan.durationInMonths);
  return renewal;
});

const showVatWarning = computed<boolean>(() => {
  const acc = get(account);
  return acc?.vatIdStatus === VatIdStatus.NOT_VALID && acc.address.country !== 'DE';
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
        :crypto="isCrypto"
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
      <RuiAlert
        type="warning"
        variant="outlined"
      >
        <i18n-t
          keypath="auth.signup.vat.vat_invalid_checkout_warning"
          tag="span"
        >
          <template #link>
            <NuxtLink
              to="/home/billing"
              class="font-medium underline"
            >
              {{ t('account.tabs.customer_information') }}
            </NuxtLink>
          </template>
        </i18n-t>
      </RuiAlert>
    </template>
  </OrderSummary>
</template>
