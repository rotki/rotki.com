<script setup lang="ts">
import type { PaymentStep } from '~/types';
import { get, toRefs } from '@vueuse/core';

const step = defineModel<PaymentStep>('step', { required: true });

const props = defineProps<{
  loading?: boolean;
  wide?: boolean;
}>();

const emit = defineEmits<{ (e: 'clear-errors'): void }>();

defineSlots<{
  default: (props: {
    status: PaymentStep;
  }) => any;
  description: () => any;
}>();

const { t } = useI18n({ useScope: 'global' });

const { loading, wide } = toRefs(props);

const isLoading = computed<boolean>(() => get(loading) || false);
const isWide = computed<boolean>(() => get(wide) || false);

function dismissFailure(): void {
  emit('clear-errors');
}
</script>

<template>
  <div
    class="flex flex-col w-full mx-auto grow"
    :class="[
      isWide ? 'max-w-7xl md:px-4' : 'max-w-[29rem] mt-8 lg:mt-0',
    ]"
  >
    <div class="mb-6">
      <CheckoutTitle>
        {{ t('home.plans.tiers.step_3.title') }}
      </CheckoutTitle>

      <slot name="description">
        <CheckoutDescription>
          {{ t('home.plans.tiers.step_3.payment_description') }}
        </CheckoutDescription>
      </slot>
    </div>

    <div :class="isWide ? '' : 'min-h-[25rem]'">
      <div
        v-if="isLoading"
        class="flex justify-center items-center min-h-[25rem]"
      >
        <RuiProgress
          variant="indeterminate"
          size="48"
          circular
          color="primary"
        />
      </div>
      <slot
        v-else
        :status="step"
      />
    </div>
  </div>

  <FloatingNotification
    :timeout="10000"
    :visible="step.type === 'failure'"
    closeable
    @dismiss="dismissFailure()"
  >
    <template #title>
      {{ step.title }}
    </template>
    {{ step.message }}
  </FloatingNotification>
</template>
