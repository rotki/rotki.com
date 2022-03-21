<template>
  <action-button
    primary
    :text="$t('actions.download')"
    @click="$emit('click')"
  />
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'DownloadButton',
})
</script>
