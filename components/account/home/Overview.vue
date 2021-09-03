<template>
  <page wide>
    <template #title> Account Management </template>
    <subscriptions />
    <payments />
  </page>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'Overview',
})
</script>
