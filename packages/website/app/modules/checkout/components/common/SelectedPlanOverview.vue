<script setup lang="ts">
import type { PaymentBreakdownResponse, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { get, set } from '@vueuse/core';
import ChangePlanDialog from '~/modules/checkout/components/plan/ChangePlanDialog.vue';
import { formatDate } from '~/utils/date';
import { getPlanNameFor } from '~/utils/plans';

interface VatOverview { vat: string; basePrice: string; vatAmount: string }

const props = withDefaults(defineProps<{
  plan: SelectedPlan;
  breakdown?: PaymentBreakdownResponse;
  crypto?: boolean;
  warning?: boolean;
  disabled?: boolean;
  loading?: boolean;
  upgrade?: boolean;
}>(), {
  breakdown: undefined,
  crypto: false,
  warning: false,
  disabled: false,
  loading: false,
  upgrade: false,
});

const emit = defineEmits<{
  'plan-change': [plan: SelectedPlan];
}>();

const { t } = useI18n({ useScope: 'global' });

const { plan, breakdown, crypto, upgrade } = toRefs(props);
const selection = ref<boolean>(false);

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
