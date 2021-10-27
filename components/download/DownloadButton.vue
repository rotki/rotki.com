<template>
  <action-button primary text="Start now for free" @click="$emit('click')" />
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'DownloadButton',
})
</script>
