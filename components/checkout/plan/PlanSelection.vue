<script lang="ts" setup>
import type { AvailablePlan } from '~/types';
import { get, set } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import PricingPeriodTab from '~/components/pricings/PricingPeriodTab.vue';
import { useCountries } from '~/composables/countries';
import { useMainStore } from '~/store';
import { useTiersStore } from '~/store/tiers';
import { PricingPeriod } from '~/types/tiers';
import { getCountryName } from '~/utils/countries';
import { canBuyNewSubscription } from '~/utils/subscription';

const { t } = useI18n({ useScope: 'global' });
const route = useRoute();
const { planParams } = usePlanParams();

const selectedPlanName = ref<string | undefined>(get(planParams)?.plan);
const selectedPlanPeriod = ref<PricingPeriod>(get(planParams)?.period || PricingPeriod.MONTHLY);

const processing = ref<boolean>(false);

const { account, userSubscriptions } = storeToRefs(useMainStore());
const tiersStore = useTiersStore();
const { country, availablePlans } = storeToRefs(tiersStore);

const { countries } = useCountries();

function isSelected(plan: AvailablePlan) {
  return plan.tierName === get(selectedPlanName);
}

const selectedPlan = computed<AvailablePlan | undefined>(
  () => get(availablePlans)?.find(plan => isSelected(plan)),
);

function select(plan: AvailablePlan) {
  set(selectedPlanName, plan.tierName);
}

function next() {
  set(processing, true);
  const planId = get(selectedPlan)?.[get(selectedPlanPeriod) === PricingPeriod.MONTHLY ? 'monthlyPlan' : 'yearlyPlan']?.planId;
  navigateTo({
    name: 'checkout-pay-method',
    query: {
      ...route.query,
      plan: get(selectedPlanName),
      period: get(selectedPlanPeriod),
      planId,
    },
  });
}

const canBuy = reactify(canBuyNewSubscription)(account, userSubscriptions);

const countryName = computed<string>(() => getCountryName(get(country), get(countries)));

const notes = computed(() => [
  t('home.plans.tiers.step_1.notes.line_1'),
  t('home.plans.tiers.step_1.notes.line_2'),
  t('home.plans.tiers.step_1.notes.line_3'),
  t('home.plans.tiers.step_1.notes.line_4'),
]);
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
          :selected="isSelected(plan)"
          @click="select(plan)"
          @clear="selectedPlanName = undefined"
        />
      </div>
    </div>

    <div class="max-w-[27.5rem] mx-auto flex flex-col justify-between grow">
      <div class="flex flex-col gap-3">
        <div
          v-for="(line, i) in notes"
          :key="i"
          class="flex gap-2"
        >
          <RuiIcon
            class="text-rui-text-secondary shrink-0"
            name="lu-circle-arrow-right"
            size="20"
          />
          <p class="text-sm">
            {{ line }}
          </p>
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

      <div class="mt-8">
        <RuiButton
          :disabled="!selectedPlan || !canBuy"
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
