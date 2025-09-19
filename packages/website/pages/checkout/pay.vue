<script lang="ts" setup>
import { get } from '@vueuse/core';
import { storeToRefs } from 'pinia';
import { useMainStore } from '~/store';
import { CHECKOUT_ROUTE_NAMES, type CheckoutStep } from '~/types';

const { t } = useI18n({ useScope: 'global' });

const route = useRoute();
const store = useMainStore();
const { plans } = storeToRefs(store);

const isCardOrSecureRoute = computed<boolean>(() => {
  const routeName = route.name;
  if (!Array.prototype.includes.call(CHECKOUT_ROUTE_NAMES, routeName)) {
    return false;
  }
  return routeName === 'checkout-pay-card' || routeName === 'checkout-pay-3d-secure';
});

const steps = computed<CheckoutStep[]>(() => {
  const baseSteps: CheckoutStep[] = [
    {
      title: t('home.plans.tiers.step_1.title'),
      description: t('home.plans.tiers.step_1.description'),
      names: ['checkout-pay'],
    },
    {
      title: t('home.plans.tiers.step_2.title'),
      description: t('home.plans.tiers.step_2.description'),
      names: ['checkout-pay-method'],
    },
    {
      title: t('home.plans.tiers.step_3.title'),
      description: t('home.plans.tiers.step_3.description'),
      names: [
        'checkout-pay-request-crypto',
        'checkout-pay-crypto',
        'checkout-pay-card',
        'checkout-pay-paypal',
      ],
    },
  ];

  // Only add step 4 for card and 3D secure routes
  if (get(isCardOrSecureRoute)) {
    baseSteps.push({
      title: t('home.plans.tiers.step_4.title'),
      description: t('home.plans.tiers.step_4.description'),
      names: ['checkout-pay-3d-secure'],
    });
  }

  return baseSteps;
});

const step = computed<number>(() => {
  const routeName = route.name;
  if (!Array.prototype.includes.call(CHECKOUT_ROUTE_NAMES, routeName)) {
    return 1; // Default to first step if route name is invalid
  }

  const index = get(steps).findIndex(step =>
    Array.prototype.includes.call(step.names, routeName),
  );
  return index + 1;
});

const { removeStoredRedirectUrl } = useRedirectUrl();

onBeforeMount(() => {
  removeStoredRedirectUrl();
});

onMounted(async () => {
  await store.getPlans();
});
</script>

<template>
  <div
    class="container flex flex-col lg:flex-row py-8 lg:py-14 h-full grow"
  >
    <div class="flex justify-center grow">
      <RuiProgress
        v-if="!plans"
        circular
        class="mt-20"
        color="primary"
        variant="indeterminate"
      />
      <form
        v-else
        class="max-w-full flex flex-col items-center justify-between"
        @submit.prevent
      >
        <NuxtPage />
        <div class="py-10 lg:px-4 w-full max-w-[29rem]">
          <RuiFooterStepper
            :model-value="step"
            :pages="steps.length"
            variant="pill"
          />
        </div>
      </form>
    </div>

    <div class="hidden lg:block max-w-[20.8rem] sticky top-0 self-start">
      <RuiStepper
        :step="step"
        :steps="steps"
        custom
        orientation="vertical"
        subtitle-class="!text-rui-primary-lighter"
        title-class="!text-rui-primary"
      />
    </div>
  </div>
</template>
