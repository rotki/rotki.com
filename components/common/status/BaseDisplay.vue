<template>
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
      <div :class="$style.title">{{ title }}</div>
      <div :class="$style.message">{{ message }}</div>
      <slot />
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from '@nuxtjs/composition-api'

const status = ['success', 'error', 'neutral'] as const

type Status = typeof status[number]

export default defineComponent({
  name: 'ErrorDisplay',
  props: {
    status: {
      required: true,
      type: String as PropType<Status>,
      validate: (value: any) => status.includes(value),
    },
    message: {
      required: true,
      type: String,
    },
    title: {
      required: true,
      type: String,
    },
  },
})
</script>

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
  @apply border rounded;

  max-width: 600px;
}

.body {
  @apply p-4 bg-white rounded-b shadow-lg;
}

.title {
  @apply font-sans font-bold flex flex-row justify-center;

  line-height: 29px;
  font-size: 24px;
  letter-spacing: 0;
  margin-bottom: 16px;
}

.message {
  @apply font-sans break-words;

  font-size: 14px;
  line-height: 20px;
}
</style>
