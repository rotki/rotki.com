<template>
  <plan :action="$tc('actions.download')" @click="$emit('download')">
    <template #title>{{ $t('home.plans.details.free.title') }}</template>
    {{ $t('home.plans.details.free.subtitle') }}
    <div :class="$style.filler"></div>
  </plan>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'FreePlan',
})
</script>

<style lang="scss" module>
@import '~assets/css/main';
@import '~assets/css/media';

.filler {
  height: 100%;
}
</style>
