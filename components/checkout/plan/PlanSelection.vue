<script lang="ts" setup>
import type { AvailablePlan } from '~/types';
import { get, set } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import PricingPeriodTab from '~/components/pricings/PricingPeriodTab.vue';
import { useMainStore } from '~/store';
import { useTiersStore } from '~/store/tiers';
import { PricingPeriod } from '~/types/tiers';
import { canBuyNewSubscription } from '~/utils/subscription';

const {
  public: {
    contact: { emailMailto },
  },
} = useRuntimeConfig();

const { t } = useI18n();
const route = useRoute();
const { plan: planParams } = usePlanParams();

const selectedPlanName = ref<string | undefined>(get(planParams)?.plan);
const selectedPlanPeriod = ref<PricingPeriod>(get(planParams)?.period || PricingPeriod.MONTHLY);

const processing = ref<boolean>(false);

const { account, authenticated } = storeToRefs(useMainStore());
const { availablePlans } = storeToRefs(useTiersStore());

function isSelected(plan: AvailablePlan) {
  return plan.name === get(selectedPlanName);
}

const selectedPlan = computed<AvailablePlan | undefined>(
  () => get(availablePlans)?.find(plan => isSelected(plan)),
);

const vat = computed(() => get(account)?.vat);

function select(plan: AvailablePlan) {
  set(selectedPlanName, plan.name);
}

function next() {
  set(processing, true);
  navigateTo({
    name: 'checkout-pay-method',
    query: {
      ...route.query,
      plan: get(selectedPlanName),
      period: get(selectedPlanPeriod),
      planId: get(selectedPlan)?.subscriptionTierId,
    },
  });
}

const canBuy = reactify(canBuyNewSubscription)(account);

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
    <CheckoutDescription>
      <template v-if="vat">
        {{ t('home.plans.tiers.step_1.vat', { vat }) }}
      </template>
      <template v-if="!authenticated">
        {{ t('home.plans.tiers.step_1.maybe_vat') }}
      </template>
    </CheckoutDescription>

    <div class="pt-12">
      <PricingPeriodTab
        v-model="selectedPlanPeriod"
        :data="availablePlans"
      />

      <div class="flex flex-col gap-4 pt-8 pb-12">
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
          v-for="plan in availablePlans"
          :key="plan.subscriptionTierId"
          :plan="plan"
          :period="selectedPlanPeriod"
          :selected="isSelected(plan)"
          @click="select(plan)"
        />
        <div class="border border-default rounded-xl p-4 flex items-center justify-between">
          <div class="text-h6 text-rui-primary">
            {{ t('pricing.plans.custom_plan') }}
          </div>
          <ButtonLink
            size="lg"
            color="primary"
            variant="outlined"
            :to="emailMailto"
          >
            {{ t('values.contact_section.title') }}
          </ButtonLink>
        </div>
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
