<script setup lang="ts">
import type { PaymentBreakdownDiscount, PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { VatIdStatus } from '@rotki/card-payment-common/schemas/account';
import DiscountCodeField from '@rotki/checkout-ui/components/DiscountCodeField.vue';
import PriceRows from '@rotki/checkout-ui/components/PriceRows.vue';
import { get } from '@vueuse/shared';
import { useAppConfig } from '~/composables/use-app-config';
import SelectedPlanOverview from '~/modules/checkout/components/common/SelectedPlanOverview.vue';
import { useMainStore } from '~/store';

const discountCodeInput = defineModel<string>('discountCode', { default: '' });

const {
  selectedPlan,
  breakdown,
  upgradeSubId,
  isCrypto = false,
  warning = false,
  compact = false,
  loading = false,
  disabled = false,
} = defineProps<{
  selectedPlan?: SelectedPlan;
  breakdown?: PaymentBreakdownResponse;
  upgradeSubId?: string;
  isCrypto?: boolean;
  warning?: boolean;
  compact?: boolean;
  loading?: boolean;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  'plan-change': [plan: SelectedPlan];
  'apply-discount': [];
}>();

const { t } = useI18n({ useScope: 'global' });

const { account } = storeToRefs(useMainStore());

// Offered in the discount field's hint while no code is applied.
const { activeCampaign } = useAppConfig();

// Spacing classes based on compact mode
const spacingClass = computed<string>(() => (compact ? 'my-4' : 'my-6'));
const titleSpacingClass = computed<string>(() => (compact ? 'mb-4' : 'mb-6'));
const discountSpacingClass = computed<string>(() => (compact ? 'mb-4' : 'mb-6'));

// Derive discountInfo from breakdown
const discountInfo = computed<PaymentBreakdownDiscount | undefined>(() => breakdown?.discount ?? undefined);

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

function handlePlanChange(newPlan: SelectedPlan): void {
  emit('plan-change', newPlan);
}
</script>

<template>
  <RuiCard v-if="selectedPlan">
    <div
      class="text-lg font-medium"
      :class="titleSpacingClass"
    >
      {{ t('home.plans.tiers.step_3.order_summary') }}
    </div>

    <SelectedPlanOverview
      :plan="selectedPlan"
      :upgrade="!!upgradeSubId"
      :crypto="isCrypto"
      :disabled="disabled"
      :loading="loading"
      :warning="warning"
      @plan-change="handlePlanChange($event)"
    />

    <RuiDivider :class="spacingClass" />

    <DiscountCodeField
      v-model="discountCodeInput"
      :disabled="disabled"
      :discount="discountInfo"
      :campaign="activeCampaign"
      :class="discountSpacingClass"
      @apply="emit('apply-discount')"
    />

    <RuiAlert
      v-if="showVatWarning"
      type="warning"
      variant="outlined"
      class="mb-4"
    >
      <i18n-t
        keypath="auth.signup.vat.vat_invalid_checkout_warning"
        tag="span"
      >
        <template #link>
          <NuxtLink
            to="/home/customer-information"
            class="font-medium underline"
          >
            {{ t('account.tabs.customer_information') }}
          </NuxtLink>
        </template>
      </i18n-t>
    </RuiAlert>

    <PriceRows
      :plan="selectedPlan"
      :breakdown="breakdown"
      :upgrade="!!upgradeSubId"
      :loading="loading"
      :duration-in-months="selectedPlan.durationInMonths"
      :renews-at="renewsAt"
      :one-time="isCrypto"
    />
  </RuiCard>
</template>
