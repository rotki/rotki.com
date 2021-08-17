<template>
  <page>
    <template #title> Invalid code </template>
    <div :class="$style.body">
      <p :class="$style.header">Could not use this code</p>
      <p>The activation link is not valid.</p>
      <p>This can happen if you have already confirmed your account.</p>
    </div>
  </page>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'InvalidActivationCode',
})
</script>

<style lang="scss" module>
@import '~assets/css/media';

.body {
  @apply font-sans text-shade11;

  height: 100%;

  @include text-size(18px, 26px);
}

.header {
  @apply font-serif text-shade11 pb-2;

  @include text-size(24px, 32px);
}
</style>
