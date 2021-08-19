<template>
  <div>Login</div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'Home',
  middleware: 'authentication',
  setup() {},
  head: {},
})
</script>
