<script setup lang="ts">
import type { CheckoutError } from '~/modules/checkout/composables/use-checkout';
import { get } from '@vueuse/shared';

const { error } = defineProps<{
  error?: CheckoutError;
}>();

const emit = defineEmits<{
  dismiss: [];
}>();

const root = useTemplateRef<HTMLDivElement>('root');

/** Moves focus to a new error, so keyboard and screen reader users land on it. */
watch(() => error, async (current, previous) => {
  if (!current || current === previous)
    return;
  await nextTick();
  get(root)?.focus();
});
</script>

<template>
  <div
    v-if="error"
    ref="root"
    role="alert"
    tabindex="-1"
    class="mt-2 outline-hidden"
    data-cy="checkout-error"
  >
    <RuiAlert
      type="error"
      closeable
      @close="emit('dismiss')"
    >
      <template #title>
        {{ error.title }}
      </template>
      {{ error.message }}
    </RuiAlert>
  </div>
</template>
