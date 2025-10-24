<script setup lang="ts">
import BaseButton from './BaseButton.vue';

interface Props {
  disabled?: boolean;
  processing?: boolean;
}

const { disabled = false, processing = false } = defineProps<Props>();

const emit = defineEmits<{
  'go-back': [];
  'continue': [];
}>();
</script>

<template>
  <div class="flex gap-4 justify-center w-full max-w-[27.5rem] mx-auto">
    <BaseButton
      variant="secondary"
      class="w-full"
      :disabled="processing"
      @click="emit('go-back')"
    >
      <svg
        class="size-4"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
      Back
    </BaseButton>
    <BaseButton
      variant="primary"
      class="w-full"
      :disabled="disabled"
      :loading="processing"
      @click="emit('continue')"
    >
      <span v-if="!processing">Continue</span>
      <span v-else>Processing...</span>
    </BaseButton>
  </div>
</template>
