<script lang="ts" setup>
import { storeToRefs } from 'pinia';
import { get } from '@vueuse/core';
import { useMainStore } from '~/store';

const { t } = useI18n();

const route = useRoute();
const store = useMainStore();
const { plans } = storeToRefs(store);

const steps = computed(() => [
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
]);

const step = computed(() => {
  const index = get(steps).findIndex(step =>
    step.names.includes(String(route.name)),
  );
  return index + 1;
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
