<template>
  <base-display :message="message" :title="title" status="error">
    <template #icon>
      <alert-icon height="48px" width="48px" />
    </template>
    <slot />
  </base-display>
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
