<template>
  <base-display :message="message" :title="title" status="success">
    <template #icon>
      <check-circle height="48px" width="48px" />
    </template>
    <slot />
  </base-display>
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
