<template>
  <div :class="$style.wrapper">
    <div :class="$style.title">{{ title }}</div>
    <div :class="$style.message">{{ message }}</div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'ErrorDisplay',
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
.wrapper {
  max-width: 600px;
}

.title {
  @apply font-sans font-bold;

  line-height: 29px;
  font-size: 24px;
  letter-spacing: 0;
  margin-bottom: 16px;
}

.message {
  @apply font-sans;
}
</style>
