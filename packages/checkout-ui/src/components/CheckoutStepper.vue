<script setup lang="ts">
import { get } from '@vueuse/shared';
import { computed } from 'vue';
import { useCheckoutMessages } from '../composables/checkout-messages';
import { CHECKOUT_STEPS, type CheckoutStepId } from '../utils/checkout-flow';

interface StepView {
  id: CheckoutStepId;
  number: number;
  label: string;
  done: boolean;
  current: boolean;
}

const { current } = defineProps<{
  current: CheckoutStepId;
}>();

const t = useCheckoutMessages();

const currentIndex = computed<number>(() => CHECKOUT_STEPS.indexOf(current));

function stepLabel(id: CheckoutStepId): string {
  switch (id) {
    case 'plan':
      return t('checkout.steps.plan');
    case 'payment':
      return t('checkout.steps.payment');
    case 'confirmation':
      return t('checkout.steps.confirmation');
  }
}

const steps = computed<StepView[]>(() => {
  const active = get(currentIndex);
  return CHECKOUT_STEPS.map((id, index) => ({
    current: index === active,
    done: index < active,
    id,
    label: stepLabel(id),
    number: index + 1,
  }));
});

const progress = computed<string>(() => t('checkout.steps.progress', {
  current: get(currentIndex) + 1,
  total: CHECKOUT_STEPS.length,
}));
</script>

<template>
  <ol
    :aria-label="t('checkout.steps.label')"
    class="hidden md:flex items-center gap-8 text-sm"
  >
    <li
      v-for="step in steps"
      :key="step.id"
      :aria-current="step.current ? 'step' : undefined"
      class="flex items-center gap-2"
      :class="step.current ? 'text-rui-text font-medium' : 'text-rui-text-secondary'"
    >
      <span
        class="size-6 shrink-0 rounded-full flex items-center justify-center text-xs"
        :class="step.done || step.current ? 'bg-rui-primary text-white' : 'border border-rui-neutral-500'"
      >
        <svg
          v-if="step.done"
          aria-hidden="true"
          class="size-3.5"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="3"
          viewBox="0 0 24 24"
        >
          <path d="m5 12 5 5 9-10" />
        </svg>
        <template v-else>{{ step.number }}</template>
      </span>
      {{ step.label }}
    </li>
  </ol>
  <span
    class="md:hidden text-sm text-rui-text-secondary"
    data-testid="checkout-step-progress"
  >
    {{ progress }}
  </span>
</template>
