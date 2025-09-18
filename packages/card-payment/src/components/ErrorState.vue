<script setup lang="ts">
interface Props {
  message: string;
  buttonText?: string;
}

interface Emits {
  'button-click': [];
}

defineProps<Props>();
defineEmits<Emits>();
</script>

<template>
  <div class="min-h-[60vh] flex flex-col items-center justify-center">
    <div class="text-center max-w-md">
      <div class="mb-4 text-rui-error">
        <svg
          class="h-12 w-12 mx-auto"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 class="text-xl font-medium mb-2">
        Payment Initialization Failed
      </h2>
      <p class="text-rui-text-secondary mb-6">
        {{ message }}
      </p>
      <button
        v-if="buttonText"
        class="px-6 py-2 bg-rui-primary text-white rounded-full hover:bg-rui-primary-darker transition-colors"
        @click="$emit('button-click')"
      >
        {{ buttonText }}
      </button>
    </div>
  </div>
</template>
