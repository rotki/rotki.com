<script setup lang="ts">
import { get, toRefs } from '@vueuse/core';
import { type IdleStep, type PaymentStep, type StepType } from '~/types';

const props = defineProps<{
  loading: boolean;
  step: PaymentStep;
}>();

const emit = defineEmits<{ (e: 'close'): void }>();

const { step } = toRefs(props);
const useType = (type: StepType | IdleStep) => {
  return computed(() => get(step).type === type);
};
const text = computed(() => {
  const currentStep = get(step);
  if (currentStep.type === 'idle') {
    return {
      title: '',
      message: '',
      closable: false,
    };
  }
  return {
    title: currentStep.title,
    message: currentStep.message,
    closable: currentStep.closeable,
  };
});

const close = () => {
  emit('close');
};

const isPending = useType('pending');
const isSuccess = useType('success');
const isFailure = useType('failure');
const userInteraction = useType('idle');

const css = useCssModule();
</script>

<template>
  <PageContainer :center-vertically="false">
    <template #title>Subscription Payment</template>
    <PageContent>
      <div :class="css.content">
        <CheckoutTitle>Payment Details</CheckoutTitle>

        <slot name="description">
          <CheckoutDescription>
            <div :class="css.description">
              <span :class="css.text">
                Payments are safely processed with
              </span>
              <BraintreeIcon :class="css.braintree" />
            </div>
          </CheckoutDescription>
        </slot>

        <LoadingIndicator v-if="loading" :class="css.loader" />
        <div v-if="userInteraction">
          <slot />
        </div>
        <PendingDisplay
          v-if="isPending"
          :message="text.message"
          :title="text.title"
        />
        <ErrorDisplay
          v-else-if="isFailure"
          :message="text.message"
          :title="text.title"
        >
          <div v-if="text.closable" :class="css.close">
            <SelectionButton :selected="false" @click="close">
              OK
            </SelectionButton>
          </div>
        </ErrorDisplay>
        <SuccessDisplay
          v-else-if="isSuccess"
          :message="text.message"
          :title="text.title"
        >
          <div :class="css['action-wrapper']">
            <NuxtLink :class="css.action" to="/home"> Manage Premium </NuxtLink>
          </div>
        </SuccessDisplay>
      </div>
    </PageContent>
  </PageContainer>
</template>

<style lang="scss" module>
.loader {
  min-height: 400px;
}

.braintree {
  @apply ml-1;

  width: 120px;
}

.text {
  @apply pt-0.5;
}

.description {
  @apply flex flex-row;
}

.content {
  @apply p-0 w-full;
}

.action {
  @apply text-primary3 text-center mt-3 mb-1;
}

.action-wrapper {
  @apply flex flex-row justify-center;
}

.close {
  @apply flex flex-row justify-center mt-4;
}
</style>
