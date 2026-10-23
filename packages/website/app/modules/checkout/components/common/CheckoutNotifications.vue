<script setup lang="ts">
import type { CheckoutError } from '~/modules/checkout/composables/use-checkout';
import FloatingNotification from '~/components/account/home/FloatingNotification.vue';

const { error, loading = false } = defineProps<{
  error?: CheckoutError;
  loading?: boolean;
}>();

const emit = defineEmits<{
  'clear-error': [];
}>();

const hasError = computed<boolean>(() => !!error);
</script>

<template>
  <!-- Global loading overlay -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-200"
      leave-active-class="transition-opacity duration-200"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
    >
      <div
        v-if="loading"
        class="fixed inset-0 bg-white/80 flex items-center justify-center z-50"
      >
        <RuiProgress
          variant="indeterminate"
          size="48"
          circular
          color="primary"
        />
      </div>
    </Transition>
  </Teleport>

  <!-- Global error notification -->
  <FloatingNotification
    :visible="hasError"
    :timeout="10000"
    closeable
    @dismiss="emit('clear-error')"
  >
    <template #title>
      {{ error?.title }}
    </template>
    {{ error?.message }}
  </FloatingNotification>
</template>
