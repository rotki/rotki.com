<script setup lang="ts">
interface Props {
  message: string;
}

defineProps<Props>();
</script>

<template>
  <div class="min-h-[60vh] flex flex-col items-center justify-center">
    <div class="text-center">
      <div class="mb-4">
        <svg
          class="animate-spin h-10 w-10 text-rui-primary mx-auto"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-dasharray="15.708"
            stroke-dashoffset="15.708"
            transform-origin="12 12"
          />
        </svg>
      </div>
      <p class="text-rui-text-secondary">
        {{ message }}
      </p>
    </div>
  </div>
</template>
