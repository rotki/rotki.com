<template>
  <div :class="$style.wrapper">
    <div :class="$style.header">
      <check-circle :class="$style.icon" height="48px" width="48px" />
    </div>
    <div :class="$style.body">
      <div :class="$style.title">{{ title }}</div>
      <div :class="$style.message">{{ message }}</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'SuccessDisplay',
  props: {
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
  @apply shadow-lg bg-green-400 rounded-t flex flex-row items-center justify-center;

  height: 120px;
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
