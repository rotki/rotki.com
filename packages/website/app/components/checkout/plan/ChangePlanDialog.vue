<script setup lang="ts">
import type { AvailablePlan, SelectedPlan } from '@rotki/card-payment-common/schemas/plans';
import { get, set, toRefs } from '@vueuse/core';
import SelectablePlan from '~/components/checkout/plan/SelectablePlan.vue';
import PricingPeriodTab from '~/components/pricings/PricingPeriodTab.vue';
import { usePlanIdParam } from '~/composables/checkout/use-plan-params';
import { useAvailablePlans } from '~/composables/tiers/use-available-plans';
import { usePremiumTiersInfo } from '~/composables/tiers/use-premium-tiers-info';
import { PricingPeriod } from '~/types/tiers';
import { logger } from '~/utils/use-logger';

const props = withDefaults(defineProps<{
  visible: boolean;
  warning?: boolean;
}>(), {
  warning: false,
});
const emit = defineEmits<{
  cancel: [];
  select: [plan: SelectedPlan];
}>();
const { planId } = usePlanIdParam();
const { visible, warning } = toRefs(props);

const { t } = useI18n({ useScope: 'global' });

const { availablePlans, getPlanDetailsFromId } = useAvailablePlans();
const { tiersInformation } = usePremiumTiersInfo();

const confirmed = ref<boolean>(false);
const selectedPlanPeriod = ref<PricingPeriod>(PricingPeriod.MONTHLY);

const currentPlanDetails = computed<ReturnType<typeof getPlanDetailsFromId>>(() => {
  const currentPlanId = get(planId);
  return currentPlanId ? getPlanDetailsFromId(currentPlanId) : undefined;
});

function isCurrentPlan(plan: AvailablePlan): boolean {
  const currentPlanId = get(planId);
  if (!currentPlanId)
    return false;

  const period = get(selectedPlanPeriod);
  const targetPlan = period === PricingPeriod.MONTHLY ? plan.monthlyPlan : plan.yearlyPlan;

  return targetPlan?.planId === currentPlanId;
}

function select(plan: AvailablePlan): void {
  if (get(warning) && !get(confirmed)) {
    return;
  }

  const period = get(selectedPlanPeriod);
  const planDetails = plan[period === PricingPeriod.MONTHLY ? 'monthlyPlan' : 'yearlyPlan'];

  if (!planDetails) {
    logger.error('Plan details not found for selected period');
    return;
  }

  const selectedPlan: SelectedPlan = {
    planId: planDetails.planId,
    name: plan.tierName,
    price: Number.parseFloat(planDetails.price),
    durationInMonths: period === PricingPeriod.MONTHLY ? 1 : 12,
  };

  emit('select', selectedPlan);
}

watch(visible, (visible) => {
  if (!visible) {
    set(confirmed, false);
  }
});

onBeforeMount(() => {
  // Initialize period from current plan
  const currentPlan = get(currentPlanDetails);
  if (currentPlan?.period) {
    set(selectedPlanPeriod, currentPlan.period);
  }
});
</script>

<template>
  <RuiDialog
    max-width="500"
    :model-value="visible"
    @closed="emit('cancel')"
  >
    <RuiCard content-class="!pt-0">
      <template #header>
        {{ t('change_plan.title') }}
      </template>
      <div
        v-if="warning"
        class="text-justify -mb-4"
      >
        <span class="text-rui-text-secondary">
          {{ t('change_plan.switch_warning') }}
        </span>
        <RuiCheckbox
          v-model="confirmed"
          class="mt-3"
          color="primary"
        >
          <i18n-t
            keypath="change_plan.switch_agree"
            scope="global"
          >
            <template #separator>
              <br />
            </template>
          </i18n-t>
        </RuiCheckbox>
      </div>
      <div class="relative pt-8">
        <PricingPeriodTab
          v-model="selectedPlanPeriod"
          :data="availablePlans"
        />
        <div class="flex flex-col gap-4 py-4">
          <SelectablePlan
            v-for="plan in availablePlans"
            :key="plan.tierName"
            class="hover:bg-rui-grey-100 transition-all"
            :plan="plan"
            :tiers-info="tiersInformation"
            readonly
            :disabled="warning && !confirmed"
            :current="isCurrentPlan(plan)"
            :period="selectedPlanPeriod"
            @click="select(plan)"
          />
        </div>
        <div class="flex justify-end gap-4 pt-4">
          <RuiButton
            variant="outlined"
            size="lg"
            class="w-full"
            color="primary"
            @click="emit('cancel')"
          >
            {{ t('actions.cancel') }}
          </RuiButton>
        </div>
        <div
          v-if="warning && !confirmed"
          class="absolute w-full h-full top-0 left-0 bg-white/[0.7]"
        />
      </div>
    </RuiCard>
  </RuiDialog>
</template>
