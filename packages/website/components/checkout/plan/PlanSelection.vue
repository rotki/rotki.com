<script lang="ts" setup>
import type { AvailablePlan } from '@rotki/card-payment-common/schemas/plans';
import { get, set } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import CheckoutTitle from '~/components/checkout/common/CheckoutTitle.vue';
import SelectablePlan from '~/components/checkout/plan/SelectablePlan.vue';
import ButtonLink from '~/components/common/ButtonLink.vue';
import PricingPeriodTab from '~/components/pricings/PricingPeriodTab.vue';
import { usePlanIdParam } from '~/composables/checkout/use-plan-params';
import { useCountries } from '~/composables/use-countries';
import { useMainStore } from '~/store';
import { useTiersStore } from '~/store/tiers';
import { PricingPeriod } from '~/types/tiers';
import { getCountryName } from '~/utils/countries';

const { t } = useI18n({ useScope: 'global' });
const route = useRoute();

const processing = ref<boolean>(false);

const { planId } = usePlanIdParam();
const selectedPlanName = ref<string | undefined>();
const selectedPlanPeriod = ref<PricingPeriod>(PricingPeriod.MONTHLY);

const mainStore = useMainStore();
const tiersStore = useTiersStore();
const { account, canBuy } = storeToRefs(mainStore);
const { country, availablePlans } = storeToRefs(tiersStore);
const { getPlanDetailsFromId } = tiersStore;
const { countries } = useCountries();

const selectedPlan = computed<AvailablePlan | undefined>(() => {
  const plans = get(availablePlans);
  const selectedName = get(selectedPlanName);

  if (!plans || !selectedName) {
    return undefined;
  }

  return plans.find(plan => plan.tierName === selectedName);
});

const countryName = computed<string>(
  () => getCountryName(get(country), get(countries)),
);

const planNotes = computed<string[]>(() => {
  const period = get(selectedPlanPeriod) === PricingPeriod.MONTHLY
    ? t('selected_plan_overview.month')
    : t('selected_plan_overview.year');

  return [
    t('home.plans.tiers.step_1.notes.line_1', { period }),
    t('home.plans.tiers.step_1.notes.line_2'),
    t('home.plans.tiers.step_1.notes.line_3'),
    t('home.plans.tiers.step_1.notes.line_4'),
  ];
});

const selectedPlanId = computed<number | undefined>(() => {
  const plan = get(selectedPlan);
  const period = get(selectedPlanPeriod);

  if (!plan) {
    return undefined;
  }

  const isMonthly = period === PricingPeriod.MONTHLY;
  return isMonthly ? plan.monthlyPlan?.planId : plan.yearlyPlan?.planId;
});

function isPlanSelected(plan: AvailablePlan): boolean {
  return plan.tierName === get(selectedPlanName);
}

function selectPlan(plan: AvailablePlan): void {
  set(selectedPlanName, plan.tierName);
}

function clearSelection(): void {
  set(selectedPlanName, undefined);
}

async function handleContinue(): Promise<void> {
  const planId = get(selectedPlanId);

  if (!planId) {
    return;
  }

  set(processing, true);

  try {
    await navigateTo({
      name: 'checkout-pay-method',
      query: {
        ...route.query,
        planId,
      },
    });
  }
  finally {
    set(processing, false);
  }
}

// Extract planName and period from planId parameter if it exists
function initializeFromPlanId(): void {
  const currentPlanId = get(planId);

  if (!currentPlanId) {
    return;
  }

  const details = getPlanDetailsFromId(currentPlanId);

  if (details) {
    set(selectedPlanName, details.planName);
    set(selectedPlanPeriod, details.period);
  }
}

// Watch for changes in planId or availablePlans and initialize selection
watch([planId, availablePlans], initializeFromPlanId, { immediate: true });
</script>

<template>
  <div class="flex flex-col w-full grow">
    <CheckoutTitle>
      {{ t('home.plans.tiers.step_1.title') }}
    </CheckoutTitle>

    <div class="pt-12">
      <PricingPeriodTab
        v-model="selectedPlanPeriod"
        :data="availablePlans"
      />

      <div class="flex flex-col gap-4 py-8">
        <template v-if="availablePlans.length === 0">
          <div
            v-for="i in 2"
            :key="i"
            class="rounded-xl border border-default p-4 flex flex-col gap-2"
          >
            <RuiSkeletonLoader class="w-20 h-7" />
            <RuiSkeletonLoader class="w-28 h-7" />
          </div>
        </template>
        <SelectablePlan
          v-for="(plan) in availablePlans"
          :key="plan.tierName"
          :plan="plan"
          :period="selectedPlanPeriod"
          :selected="isPlanSelected(plan)"
          @click="selectPlan(plan)"
          @clear="clearSelection()"
        />
      </div>
    </div>

    <div class="max-w-[27.5rem] mx-auto flex flex-col justify-between grow">
      <div class="max-w-[27.5rem] mx-auto flex flex-col justify-between grow">
        <div class="flex flex-col gap-3">
          <div
            v-for="(line, i) in planNotes"
            :key="i"
            class="flex gap-2 items-start"
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
      </div>

      <div
        v-if="!account"
        class="flex flex-col gap-2 mt-8 -mb-6"
      >
        <div class="text-sm text-rui-text-secondary">
          <i18n-t
            v-if="country"
            keypath="home.plans.country_prices"
            scope="global"
            tag="div"
          >
            <template #country>
              {{ countryName }}
            </template>
            <template #login>
              <ButtonLink
                to="/login"
                inline
                color="primary"
              >
                {{ t('auth.login.title') }}
              </ButtonLink>
            </template>
          </i18n-t>
          <i18n-t
            v-else
            keypath="home.plans.login_to_show_prices"
            scope="global"
            tag="div"
          >
            <template #login>
              <ButtonLink
                to="/login"
                inline
                color="primary"
              >
                {{ t('auth.login.title') }}
              </ButtonLink>
            </template>
          </i18n-t>
        </div>
      </div>

      <div class="mt-[2.63rem]">
        <RuiButton
          :disabled="!selectedPlan || !canBuy"
          :loading="processing"
          class="w-full"
          color="primary"
          size="lg"
          @click="handleContinue()"
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
