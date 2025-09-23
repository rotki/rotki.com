<script setup lang="ts">
import { get, set } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import SelectablePlan from '~/components/checkout/plan/SelectablePlan.vue';
import { getHighestPlanOnPeriod, getPricingPeriod } from '~/components/pricings/utils';
import { useTiersStore } from '~/store/tiers';
import { type AvailablePlan, PaymentMethod, type UserSubscription } from '~/types';
import { PricingPeriod } from '~/types/tiers';

const subscription = defineModel<UserSubscription | undefined>({ required: true });

const { t } = useI18n({ useScope: 'global' });

const store = useTiersStore();
const { availablePlans } = storeToRefs(store);
const router = useRouter();

const selectedPlan = ref<AvailablePlan>();
const loading = ref<boolean>(false);
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
    getPlanPrice(plan, isYearly) > currentPrice,
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
    alert.show = true;
    alert.message = t('upgrade_plan.error.no_selected_plan');
    return;
  }

  const period = get(currentPeriod);
  const planId = period === PricingPeriod.YEARLY
    ? plan.yearlyPlan?.planId
    : plan.monthlyPlan?.planId;

  if (!planId) {
    alert.show = true;
    alert.message = t('upgrade_plan.error.plan_not_found');
    return;
  }

  const paymentMethod = sub.paymentMethod;
  if (!paymentMethod) {
    alert.show = true;
    alert.message = t('upgrade_plan.error.payment_method_unknown');
    return;
  }

  alert.show = false;

  const queryParams = {
    planId,
    period,
    plan: plan.tierName,
    upgradeSubId: sub.id,
  };

  const routeName = {
    [PaymentMethod.CRYPTO]: 'checkout-pay-request-crypto',
    [PaymentMethod.CARD]: 'checkout-pay-card',
    [PaymentMethod.PAYPAL]: 'checkout-pay-paypal',
  }[paymentMethod];

  const { href } = router.resolve({
    name: routeName,
    query: queryParams,
  });

  set(loading, true);

  if (paymentMethod !== PaymentMethod.CRYPTO) {
    window.location.href = new URL(
      `${window.location.origin}${href}`,
    ).toString();
  }
  else {
    navigateTo(href);
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
              :disabled="alert.show"
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
            @click="cancel()"
          >
            {{ t('actions.cancel') }}
          </RuiButton>
          <RuiButton
            v-if="higherPlans.length > 0"
            color="primary"
            :disabled="!selectedPlan || loading"
            @click="submitUpgrade()"
          >
            {{ t('actions.upgrade') }}
          </RuiButton>
        </div>
      </template>
    </RuiCard>
  </RuiDialog>
</template>
