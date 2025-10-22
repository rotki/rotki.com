<script lang="ts" setup>
import type { Plan } from '~/types';
import { get, set } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';
import { navigateToWithCSPSupport } from '~/utils/navigation';
import { canBuyNewSubscription } from '~/utils/subscription';

interface PlanWithDiscount extends Plan {
  freeMonths?: number;
  paidMonths?: number;
  originalPrice?: string;
  originalMonthlyPrice?: string;
}

const { t } = useI18n({ useScope: 'global' });
const route = useRoute();
const { plan: savedPlan } = usePlanParams();

const { account, authenticated, plans } = storeToRefs(useMainStore());

const identifier = ref<number>(get(savedPlan));
const processing = ref<boolean>(false);

const selected = computed<Plan | undefined>(
  () => get(plans)?.find(plan => plan.months === get(identifier)),
);

const vat = computed(() => get(account)?.vat);

const notes = computed<string[]>(() => {
  const selectedPlan = get(selected);
  const period = selectedPlan?.months === 1
    ? t('selected_plan_overview.month')
    : t('selected_plan_overview.year');

  return [
    t('home.plans.tiers.step_1.notes.line_1', { period }),
    t('home.plans.tiers.step_1.notes.line_2'),
    t('home.plans.tiers.step_1.notes.line_3'),
    t('home.plans.tiers.step_1.notes.line_4'),
  ];
});

const plansWithDiscount = computed<PlanWithDiscount[]>(() => {
  const allPlans = get(plans);
  if (!allPlans || allPlans.length < 2)
    return allPlans || [];

  const monthlyPlan = allPlans.find(plan => plan.months === 1);
  const yearlyPlan = allPlans.find(plan => plan.months === 12);

  if (!monthlyPlan || !yearlyPlan)
    return allPlans;

  const monthlyPlanPrice = parseFloat(monthlyPlan.priceFiat);
  const monthlyTotal = monthlyPlanPrice * 12;
  const yearlyTotal = parseFloat(yearlyPlan.priceFiat);
  const savings = monthlyTotal - yearlyTotal;
  const discountPercentage = Math.round((savings / monthlyTotal) * 100);
  const freeMonths = Math.round((savings / monthlyPlanPrice));

  return allPlans.map((plan): PlanWithDiscount => {
    if (plan.months !== 12) {
      return plan;
    }

    const paidMonths = plan.months - freeMonths;
    const originalPrice = (monthlyPlanPrice * 12).toFixed(2);
    const originalMonthlyPrice = monthlyPlanPrice.toFixed(2);

    return {
      ...plan,
      discount: discountPercentage,
      freeMonths,
      originalMonthlyPrice,
      originalPrice,
      paidMonths,
    };
  });
});

const isSelected = (plan: Plan) => plan.months === get(identifier);

function select(plan: Plan) {
  set(identifier, plan.months);
}

async function next(): Promise<void> {
  set(processing, true);
  await navigateToWithCSPSupport({
    name: 'checkout-pay-method',
    query: { ...route.query, plan: get(identifier) },
  });
}

const canBuy = reactify(canBuyNewSubscription)(account);
</script>

<template>
  <div class="flex flex-col w-full grow">
    <CheckoutTitle>
      {{ t('home.plans.tiers.step_1.title') }}
    </CheckoutTitle>
    <CheckoutDescription>
      <span v-if="vat">{{ t('home.plans.tiers.step_1.vat', { vat }) }}</span>
      <span v-if="!authenticated">
        {{ t('home.plans.tiers.step_1.maybe_vat') }}
      </span>
    </CheckoutDescription>

    <div class="flex flex-col w-full justify-center my-8">
      <div class="w-full lg:w-auto grid sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-6 xl:gap-8">
        <SelectablePlan
          v-for="plan in plansWithDiscount"
          :key="plan.months"
          :plan="plan"
          :popular="plan.months === 12"
          :selected="isSelected(plan)"
          @click="select(plan)"
        />
      </div>
    </div>

    <div class="max-w-[27.5rem] mx-auto flex flex-col justify-between grow">
      <div class="flex flex-col gap-4">
        <div
          v-for="(line, i) in notes"
          :key="i"
          class="flex gap-3 items-start"
        >
          <div class="mt-0.5 shrink-0">
            <RuiIcon
              class="text-rui-primary"
              name="lu-circle-check"
              size="20"
            />
          </div>
          <p class="text-rui-text text-sm leading-relaxed">
            {{ line }}
          </p>
        </div>
      </div>

      <div class="mt-[2.63rem]">
        <RuiButton
          :disabled="!selected || !canBuy"
          :loading="processing"
          class="w-full"
          color="primary"
          size="lg"
          @click="next()"
        >
          {{ t('actions.continue') }}
        </RuiButton>
      </div>

      <div
        v-if="!canBuy"
        class="inline text-sm text-rui-text-secondary mt-2"
      >
        <span>* {{ t('home.plans.cannot_continue') }}</span>
        <ButtonLink
          to="/home/subscription"
          variant="text"
          color="primary"
          inline
          class="leading-[0] hover:underline"
        >
          {{ t('page_header.manage_premium') }}
        </ButtonLink>
      </div>
    </div>
  </div>
</template>
