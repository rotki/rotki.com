<script setup lang="ts">
import { get, toRefs } from '@vueuse/core';
import { type IdleStep, type PaymentStep, type StepType } from '~/types';

const props = defineProps<{
  step: PaymentStep;
}>();

const { t } = useI18n();

const { step } = toRefs(props);
const useType = (type: StepType | IdleStep) =>
  computed(() => get(step).type === type);

const isPending = useType('pending');
const isSuccess = useType('success');
const isFailure = useType('failure');

const css = useCssModule();
</script>

<template>
  <div :class="css.content">
    <CheckoutTitle>
      {{ t('home.plans.tiers.step_3.title') }}
    </CheckoutTitle>

    <slot name="description">
      <CheckoutDescription>
        {{ t('home.plans.tiers.step_3.payment_description') }}
      </CheckoutDescription>
    </slot>

    <slot
      :failure="isFailure"
      :pending="isPending"
      :success="isSuccess"
      :status="step"
    />
  </div>
</template>

<style lang="scss" module>
.loader {
  @apply min-h-[25rem];
}

.braintree {
  @apply ml-1 w-[7.5rem];
}

.text {
  @apply pt-0.5;
}

.description {
  @apply flex flex-row justify-center;
}

.content {
  @apply flex flex-col w-full max-w-[29rem] mx-auto mt-8 lg:mt-0 grow;
}

.action {
  @apply text-rui-primary-darker text-center mt-3 mb-1;
}

.action-wrapper {
  @apply flex flex-row justify-center;
}

.close {
  @apply flex flex-row justify-center mt-4;
}
</style>
