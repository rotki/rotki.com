<template>
  <base-display :message="message" :title="title" status="neutral">
    <template #icon>
      <ripple-loader />
    </template>
    <slot />
  </base-display>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'PendingDisplay',
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
