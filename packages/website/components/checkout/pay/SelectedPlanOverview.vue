<script setup lang="ts">
import type { PriceBreakdown, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { get, isDefined, set } from '@vueuse/core';
import { computed } from 'vue';
import { useTiersStore } from '~/store/tiers';
import { formatDate } from '~/utils/date';
import { getPlanNameFor } from '~/utils/plans';

interface VatOverview { vat: string; basePrice: string }

const props = withDefaults(defineProps<{
  plan: SelectedPlan;
  crypto?: boolean;
  warning?: boolean;
  disabled?: boolean;
  loading?: boolean;
  nextPayment?: number;
  internalMode?: boolean;
}>(), {
  crypto: false,
  warning: false,
  internalMode: false,
  disabled: false,
  loading: false,
});

const emit = defineEmits<{
  'plan-change': [plan: SelectedPlan];
}>();

const { t } = useI18n({ useScope: 'global' });
const router = useRouter();

const { plan, nextPayment, internalMode } = toRefs(props);

const priceBreakdown = ref<PriceBreakdown>();
const isLoadingPriceBreakdown = ref<boolean>(false);
const selection = ref<boolean>(false);

const tiersStore = useTiersStore();

const name = computed<string>(() => getPlanNameFor(t, get(plan)));

const date = computed<string>(() => formatDate(new Date()));

const nextPaymentDate = computed<string | undefined>(() => {
  if (!isDefined(nextPayment)) {
    return undefined;
  }
  const date = new Date(get(nextPayment) * 1000);
  return formatDate(date);
});

const vatOverview = computed<VatOverview | undefined>(() => {
  if (!isDefined(priceBreakdown)) {
    return undefined;
  }
  const { vatRate, priceBreakdown: breakdown } = get(priceBreakdown);

  const floatRate = parseFloat(vatRate);
  if (isFinite(floatRate) && floatRate <= 0) {
    return undefined;
  }

  return {
    vat: vatRate,
    basePrice: breakdown.basePrice,
  };
});

async function fetchPriceBreakdown(): Promise<void> {
  set(isLoadingPriceBreakdown, true);
  try {
    const breakdown = await tiersStore.getPriceBreakdown(get(plan).planId);
    set(priceBreakdown, breakdown);
  }
  catch (error) {
    logger.error('Failed to fetch price breakdown:', error);
  }
  finally {
    set(isLoadingPriceBreakdown, false);
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
    fetchPriceBreakdown();
  }
});

onMounted(() => {
  fetchPriceBreakdown();
});
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

        <i18n-t
          keypath="selected_plan_overview.plan"
          :plural="crypto ? 0 : 1"
          scope="global"
          tag="div"
          class="font-medium whitespace-break-spaces"
        >
          <template #period>
            {{ t('selected_plan_overview.renew_period', { months: plan.durationInMonths }, plan.durationInMonths) }}
          </template>
        </i18n-t>

        <i18n-t
          keypath="selected_plan_overview.price"
          scope="global"
          tag="div"
          class="mt-3"
        >
          <template #price>
            <span class="font-bold">{{ plan.price }}</span>
          </template>
          <template #vat>
            <span v-if="vatOverview && !crypto">
              {{ t('selected_plan_overview.vat', { vat: vatOverview.vat, basePrice: vatOverview.basePrice }) }}
            </span>
            <span v-else-if="vatOverview">
              {{ t('selected_plan_overview.includes_vat', { vat: vatOverview.vat }) }}
            </span>
          </template>
        </i18n-t>

        <i18n-t
          v-if="!crypto"
          keypath="selected_plan_overview.starting"
          scope="global"
          tag="div"
        >
          <template #date>
            <span class="font-bold">{{ date }}</span>
          </template>
        </i18n-t>

        <i18n-t
          v-if="!crypto"
          keypath="selected_plan_overview.next_payment"
          tag="div"
          scope="global"
          class="text-xs text-rui-text-secondary"
        >
          <template #date>
            <span class="font-bold">{{ nextPaymentDate }}</span>
          </template>
        </i18n-t>

        <div class="text-xs mt-1 italic whitespace-break-spaces">
          <template v-if="!crypto">
            {{
              t('selected_plan_overview.recurring_info', {
                period: plan.durationInMonths === 12 ? t('selected_plan_overview.year') : t('selected_plan_overview.month'),
              })
            }}
          </template>
          <template v-else>
            {{ t('selected_plan_overview.one_time_payment') }}
          </template>
        </div>

        <div>
          <RuiButton
            :disabled="disabled"
            :loading="loading"
            color="primary"
            variant="text"
            @click="select()"
          >
            {{ t('actions.change') }}
          </RuiButton>
          <ChangePlanDialog
            :crypto="crypto"
            :warning="warning"
            :vat="vatOverview?.vat"
            :visible="selection"
            @cancel="selection = false"
            @select="switchTo($event)"
          />
        </div>
      </div>
    </div>
  </RuiCard>
</template>
