<template>
  <action-button text="Start now for free" primary @click="$emit('click')" />
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'DownloadButton',
})
</script>
