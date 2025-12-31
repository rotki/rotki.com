<script setup lang="ts">
import type { PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { get, set } from '@vueuse/core';
import { computed } from 'vue';
import ChangePlanDialog from '~/components/checkout/plan/ChangePlanDialog.vue';
import { useTiersApi } from '~/composables/tiers/use-tiers-api';
import { formatDate } from '~/utils/date';
import { getPlanNameFor } from '~/utils/plans';
import { logger } from '~/utils/use-logger';

interface VatOverview { vat: string; basePrice: string; vatAmount: string }

const breakdown = defineModel<PaymentBreakdownResponse | undefined>('breakdown', { required: false });

const props = withDefaults(defineProps<{
  plan: SelectedPlan;
  crypto?: boolean;
  warning?: boolean;
  disabled?: boolean;
  loading?: boolean;
  internalMode?: boolean;
  upgrade?: boolean;
  discountCode?: string;
}>(), {
  crypto: false,
  warning: false,
  internalMode: false,
  disabled: false,
  loading: false,
  upgrade: false,
  discountCode: undefined,
});

const emit = defineEmits<{
  'plan-change': [plan: SelectedPlan];
}>();

const { t } = useI18n({ useScope: 'global' });
const router = useRouter();

const { plan, internalMode, crypto, upgrade, discountCode } = toRefs(props);
const isLoadingBreakdown = ref<boolean>(false);
const selection = ref<boolean>(false);

const { fetchPaymentBreakdown } = useTiersApi();

const name = computed<string>(() => getPlanNameFor(t, get(plan)));

const date = computed<string>(() => formatDate(new Date()));

const displayPrice = computed<string>(() => {
  const currentBreakdown = get(breakdown);
  if (currentBreakdown && !get(upgrade)) {
    return currentBreakdown.fullAmount;
  }
  return get(plan).price.toString();
});

const proratedPrice = computed<string | undefined>(() => {
  const currentBreakdown = get(breakdown);
  if (!currentBreakdown || !get(upgrade)) {
    return undefined;
  }
  return currentBreakdown.fullAmount;
});

const vatOverview = computed<VatOverview | undefined>(() => {
  const currentBreakdown = get(breakdown);
  if (!currentBreakdown) {
    return undefined;
  }

  const floatRate = parseFloat(currentBreakdown.vatRate);
  if (isFinite(floatRate) && floatRate <= 0) {
    return undefined;
  }

  const vat = floatRate > 0 && floatRate < 1 ? `${floatRate * 100}` : currentBreakdown.vatRate;

  // Calculate base price from finalAmount - vatAmount for prorated VAT display
  const finalAmount = parseFloat(currentBreakdown.finalAmount);
  const vatAmount = parseFloat(currentBreakdown.vatAmount);
  const basePrice = (finalAmount - vatAmount).toFixed(2);

  return {
    vat,
    basePrice,
    vatAmount: vatAmount.toFixed(2),
  };
});

async function loadPaymentBreakdown(): Promise<void> {
  set(isLoadingBreakdown, true);
  try {
    const code = get(discountCode);
    const response = await fetchPaymentBreakdown({
      newPlanId: get(plan).planId,
      isCryptoPayment: get(crypto),
      ...(code ? { discountCode: code } : {}),
    });
    set(breakdown, response);
  }
  catch (error) {
    logger.error('Failed to fetch payment breakdown:', error);
  }
  finally {
    set(isLoadingBreakdown, false);
  }
}

function select(): void {
  set(selection, true);
}

function switchTo(selectedPlan: SelectedPlan): void {
  set(selection, false);

  if (get(internalMode)) {
    // Internal mode: emit the plan change to parent
    emit('plan-change', selectedPlan);
  }
  else {
    // Normal mode: update route
    const currentRoute = get(router.currentRoute);
    navigateTo({
      path: currentRoute.path,
      query: {
        ...currentRoute.query,
        planId: selectedPlan.planId.toString(),
      },
    });
  }
}

watch(plan, (newPlan, oldPlan) => {
  if (newPlan.planId !== oldPlan?.planId) {
    loadPaymentBreakdown();
  }
});

// Refresh breakdown when discount code changes
watch(discountCode, () => {
  loadPaymentBreakdown();
});

onMounted(() => {
  loadPaymentBreakdown();
});
</script>

<template>
  <div class="mb-4">
    <!-- Plan name with upgrade badge and change button -->
    <div class="flex items-center justify-between mb-1">
      <div class="flex items-center gap-2">
        <span class="text-base font-semibold text-rui-text">{{ name }}</span>
        <span
          v-if="upgrade"
          class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-rui-primary/10 text-rui-primary rounded-full"
        >
          <RuiIcon
            name="lu-arrow-up"
            size="12"
          />
          {{ t('actions.upgrade') }}
        </span>
      </div>
      <RuiButton
        v-if="!upgrade"
        :disabled="disabled"
        :loading="loading"
        color="primary"
        variant="outlined"
        size="sm"
        @click="select()"
      >
        {{ t('actions.change') }}
      </RuiButton>
    </div>

    <!-- Duration description -->
    <i18n-t
      keypath="selected_plan_overview.plan"
      :plural="crypto ? 0 : 1"
      scope="global"
      tag="p"
      class="text-sm text-gray-500 mb-3"
    >
      <template #period>
        {{ t('selected_plan_overview.renew_period', { months: plan.durationInMonths }, plan.durationInMonths) }}
      </template>
    </i18n-t>

    <!-- Price details -->
    <div class="space-y-1.5 text-sm">
      <!-- Full price -->
      <div class="flex justify-between">
        <span class="text-gray-600">
          {{ proratedPrice ? t('selected_plan_overview.full_price_label') : t('selected_plan_overview.price_label') }}
        </span>
        <span :class="proratedPrice ? 'text-gray-400 line-through' : 'font-medium text-rui-text'">
          {{ displayPrice }} €
        </span>
      </div>

      <!-- Prorated price (upgrade only) -->
      <div
        v-if="proratedPrice"
        class="flex justify-between items-center"
      >
        <span class="flex items-center gap-1 text-gray-600">
          {{ t('selected_plan_overview.prorated_price_label') }}
          <RuiTooltip
            :popper="{ placement: 'top' }"
            tooltip-class="max-w-xs"
          >
            <template #activator>
              <RuiIcon
                name="lu-info"
                class="text-gray-400 cursor-help"
                size="14"
              />
            </template>
            {{ t('selected_plan_overview.proration_info') }}
          </RuiTooltip>
        </span>
        <span class="font-medium text-rui-primary">{{ proratedPrice }} €</span>
      </div>

      <!-- Starting date -->
      <div
        v-if="!crypto"
        class="flex justify-between pt-1"
      >
        <span class="text-gray-600">{{ t('selected_plan_overview.starting_label') }}</span>
        <span class="font-medium text-rui-text">{{ date }}</span>
      </div>
    </div>

    <ChangePlanDialog
      :crypto="crypto"
      :warning="warning"
      :vat="vatOverview?.vat"
      :visible="selection"
      @cancel="selection = false"
      @select="switchTo($event)"
    />
  </div>
</template>
