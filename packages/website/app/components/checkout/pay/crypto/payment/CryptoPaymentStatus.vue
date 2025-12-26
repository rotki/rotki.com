<script setup lang="ts">
import type { PaymentStep } from '~/types';
import { get } from '@vueuse/core';
import { computed } from 'vue';

const props = defineProps<{
  status: PaymentStep;
}>();

const isVisible = computed<boolean>(() => {
  const status = get(props).status;
  return status.type === 'pending';
});
</script>

<template>
  <!-- Overlay Modal -->
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300 ease-in-out"
      leave-active-class="transition-opacity duration-300 ease-in-out"
      enter-from-class="opacity-0"
      leave-to-class="opacity-0"
      appear
    >
      <div
        v-if="isVisible"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      >
        <!-- Pending state -->
        <div class="flex flex-col items-center justify-center text-center px-4">
          <div class="mb-4">
            <RuiProgress
              variant="indeterminate"
              size="48"
              circular
              color="primary"
            />
          </div>
          <h3 class="text-lg font-medium text-white mb-1">
            {{ status.title }}
          </h3>
          <p class="text-white/80">
            {{ status.message }}
          </p>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
