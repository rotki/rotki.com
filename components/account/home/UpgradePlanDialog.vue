<script setup lang="ts">
import type { AvailablePlan, UserSubscription } from '~/types';
import { get, set } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import SelectablePlan from '~/components/checkout/plan/SelectablePlan.vue';
import { getHighestPlanOnPeriod, getPricingPeriod } from '~/components/pricings/utils';
import { useSubscription } from '~/composables/use-subscription';
import { useMainStore } from '~/store';
import { useTiersStore } from '~/store/tiers';
import { PricingPeriod } from '~/types/tiers';

const subscription = defineModel<UserSubscription | undefined>({ required: true });

const emit = defineEmits<{
  (e: 'upgrade', plan: AvailablePlan): void;
}>();

const { t } = useI18n({ useScope: 'global' });

const store = useTiersStore();
const { availablePlans } = storeToRefs(store);
const { upgradeBraintreeSubscription } = useSubscription();
const { refreshUserData } = useMainStore();

const upgrading = ref<boolean>(false);
const selectedPlan = ref<AvailablePlan>();
const alert = reactive<{
  show: boolean;
  type: 'success' | 'error';
  message: string;
}>({
  show: false,
  type: 'success',
  message: '',
});

const visible = computed<boolean>({
  get: () => !!get(subscription),
  set: (value) => {
    if (!value) {
      set(subscription, undefined);
      alert.show = false;
      set(selectedPlan, undefined);
    }
  },
});

const currentPeriod = computed<PricingPeriod>(() => getPricingPeriod(get(subscription)?.durationInMonths));

function getPlanPrice(plan: AvailablePlan, isYearly: boolean): number {
  const pricing = isYearly ? plan.yearlyPlan : plan.monthlyPlan;
  return pricing?.price ? Number.parseFloat(pricing.price) : 0;
}

function hasPlanPricing(plan: AvailablePlan, isYearly: boolean): boolean {
  const pricing = isYearly ? plan.yearlyPlan : plan.monthlyPlan;
  return !!pricing?.price;
}

const higherPlans = computed<AvailablePlan[]>(() => {
  const plans = get(availablePlans);
  const sub = get(subscription);

  if (!sub || plans.length === 0) {
    return [];
  }

  const highestPlanName = getHighestPlanOnPeriod(plans, sub.durationInMonths);
  if (sub.planName === highestPlanName) {
    return [];
  }

  const isYearly = get(currentPeriod) === PricingPeriod.YEARLY;
  const currentPlan = plans.find(plan => plan.tierName === sub.planName);

  if (!currentPlan) {
    return [];
  }

  const currentPrice = getPlanPrice(currentPlan, isYearly);

  return plans.filter(plan =>
    hasPlanPricing(plan, isYearly) && getPlanPrice(plan, isYearly) > currentPrice,
  );
});

function selectPlan(plan: AvailablePlan) {
  set(selectedPlan, plan);
  alert.show = false;
}

async function submitUpgrade() {
  const sub = get(subscription);
  const plan = get(selectedPlan);

  if (!sub || !plan) {
    logger.error('No subscription or plan selected');
    return;
  }

  const period = get(currentPeriod);
  const planId = period === PricingPeriod.YEARLY
    ? plan.yearlyPlan?.planId
    : plan.monthlyPlan?.planId;

  if (!planId) {
    logger.error('Plan ID not found for selected period');
    return;
  }

  set(upgrading, true);
  alert.show = false;

  try {
    if (sub.paymentProvider === 'crypto') {
      navigateTo({
        name: 'checkout-pay-request-crypto',
        query: {
          planId,
          period,
          plan: plan.tierName,
          upgradeSubId: sub.id,
        },
      });
      return;
    }

    const result = await upgradeBraintreeSubscription(sub, planId);

    if (result.isError) {
      Object.assign(alert, {
        type: 'error',
        message: result.error?.message || t('upgrade_plan.error.message'),
        show: true,
      });
    }
    else {
      Object.assign(alert, {
        type: 'success',
        message: t('upgrade_plan.success.message', { plan: plan.tierName }),
        show: true,
      });

      // Refresh data and emit upgrade event
      await refreshUserData();
      emit('upgrade', plan);

      // Close dialog after a short delay to show success message
      setTimeout(() => {
        set(visible, false);
      }, 2000);
    }
  }
  catch (error: any) {
    logger.error('Failed to upgrade subscription:', error);
    Object.assign(alert, {
      type: 'error',
      message: error.message || t('upgrade_plan.error.message'),
      show: true,
    });
  }
  finally {
    set(upgrading, false);
  }
}

function cancel(): void {
  set(visible, false);
  alert.show = false;
}
</script>

<template>
  <RuiDialog
    v-model="visible"
    max-width="500"
  >
    <RuiCard content-class="!pt-0">
      <template #header>
        {{ t('upgrade_plan.title') }}
      </template>
      <template #subheader>
        {{
          t('upgrade_plan.current_plan', {
            plan: subscription?.planName,
            period: currentPeriod === PricingPeriod.YEARLY ? t('common.yearly') : t('common.monthly'),
          })
        }}
      </template>

      <div class="space-y-4">
        <div
          v-if="higherPlans.length === 0"
          class="text-center py-8 flex flex-col items-center"
        >
          <RuiIcon
            name="lu-circle-arrow-up"
            size="48"
            class="text-rui-text-disabled mb-4"
          />
          <p class="text-rui-text-secondary">
            {{ t('upgrade_plan.no_higher_plans') }}
          </p>
        </div>

        <template v-else>
          <div class="text-rui-text-secondary">
            {{ t('upgrade_plan.description') }}
          </div>

          <div
            class="space-y-3"
          >
            <SelectablePlan
              v-for="plan in higherPlans"
              :key="plan.tierName"
              :plan="plan"
              :period="currentPeriod"
              :selected="selectedPlan?.tierName === plan.tierName"
              :disabled="upgrading || alert.show"
              @click="selectPlan(plan)"
            />
          </div>
        </template>

        <RuiAlert
          v-if="alert.show"
          :type="alert.type"
          class="mt-4"
        >
          {{ alert.message }}
        </RuiAlert>
      </div>

      <template #footer>
        <div class="flex w-full justify-end gap-3">
          <RuiButton
            variant="outlined"
            color="primary"
            :disabled="upgrading"
            @click="cancel()"
          >
            {{ t('actions.cancel') }}
          </RuiButton>
          <RuiButton
            v-if="higherPlans.length > 0"
            color="primary"
            :disabled="!selectedPlan || upgrading"
            :loading="upgrading"
            @click="submitUpgrade()"
          >
            {{ t('actions.upgrade') }}
          </RuiButton>
        </div>
      </template>
    </RuiCard>
  </RuiDialog>
</template>
