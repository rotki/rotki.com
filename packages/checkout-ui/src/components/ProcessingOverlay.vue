<script setup lang="ts">
import { useCheckoutMessages } from '../composables/checkout-messages';

const { visible, message } = defineProps<{
  visible: boolean;
  /** The line under the title; asks the buyer to wait by default. */
  message?: string;
}>();

const t = useCheckoutMessages();
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300 ease-in-out"
      leave-active-class="transition-opacity duration-300 ease-in-out"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
      appear
    >
      <div
        v-if="visible"
        role="status"
        class="fixed inset-0 z-rui-blocking flex items-center justify-center bg-black/80 backdrop-blur-xs"
        data-testid="processing-overlay"
      >
        <div class="flex flex-col items-center gap-1 px-4 text-center">
          <div
            aria-hidden="true"
            class="size-12 mb-3 rounded-full border-4 border-white/30 border-t-white animate-spin"
          />
          <p class="text-lg font-medium text-white">
            {{ t('checkout.processing.title') }}
          </p>
          <p class="text-white/80">
            {{ message ?? t('checkout.processing.wait') }}
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
