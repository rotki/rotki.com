<script setup lang="ts">
defineProps<{
  status: Status;
  message: string;
  title: string;
}>();

const _statuses = ['success', 'error', 'neutral'] as const;

type Status = (typeof _statuses)[number];
</script>

<template>
  <div :class="$style.container">
    <div :class="$style.wrapper">
      <div
        :class="{
          [$style.header]: true,
          [$style.error]: status === 'error',
          [$style.success]: status === 'success',
          [$style.neutral]: status === 'neutral',
        }"
      >
        <slot name="icon" />
      </div>
      <div :class="$style.body">
        <div :class="$style.title">
          {{ title }}
        </div>
        <div :class="$style.message">
          {{ message }}
        </div>
        <slot />
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
.header {
  @apply shadow-lg rounded-t flex flex-row items-center justify-center;

  height: 120px;
}

.header.error {
  @apply bg-red-400;
}

.header.success {
  @apply bg-green-400;
}

.header.neutral {
  @apply bg-blue-400;
}

.wrapper {
  @apply border rounded mt-4;

  @media only screen and (max-width: 600px) {
    width: 100%;
  }

  @media only screen and (min-width: 601px) {
    width: 600px;
  }
}

.container {
  @apply w-full flex flex-row justify-center;
}

.body {
  @apply p-4 bg-white rounded-b shadow-lg;
}

.title {
  @apply font-bold flex flex-row justify-center mb-4 text-2xl leading-7;

  letter-spacing: 0;
}

.message {
  @apply break-words leading-5 text-lg font-medium;
}
</style>
