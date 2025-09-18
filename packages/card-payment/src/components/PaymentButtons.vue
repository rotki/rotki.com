<script setup lang="ts">
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
  <div class="flex gap-4 justify-center mt-9 w-full max-w-[27.5rem] mx-auto">
    <button
      type="button"
      class="w-full relative flex items-center justify-center gap-2 text-base font-medium leading-[1.625rem] outline-1 outline-offset-[-1px] outline-transparent rounded border-0 px-6 py-2 transition-all duration-150 bg-rui-grey-200 text-rui-text hover:bg-rui-grey-100 disabled:opacity-50 disabled:cursor-not-allowed"
      :disabled="processing"
      @click="emit('go-back')"
    >
      Back
    </button>
    <button
      type="button"
      class="w-full relative flex items-center justify-center gap-2 text-base font-medium leading-[1.625rem] outline-1 outline-offset-[-1px] outline-transparent rounded border-0 px-6 py-2 transition-all duration-150 bg-rui-primary text-white hover:bg-rui-primary-darker disabled:opacity-50 disabled:cursor-not-allowed"
      :disabled="disabled || processing"
      @click="emit('continue')"
    >
      <span v-if="!processing">Continue</span>
      <span
        v-else
        class="flex items-center"
      >
        <svg
          class="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            class="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="4"
          />
          <path
            class="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        Processing...
      </span>
    </button>
  </div>
</template>
