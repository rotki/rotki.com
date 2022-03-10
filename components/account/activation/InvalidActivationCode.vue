<template>
  <div :class="$style.body">
    <p :class="$style.header">Invalid Link</p>
    <p :class="$style.text">The activation link is not valid.</p>
    <p>This can happen if you have already confirmed your account.</p>
  </div>
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
  max-width: 550px;

  @include text-size(18px, 26px);
}

.header {
  @apply font-serif font-bold text-shade11 pb-2;

  @include text-size(24px, 32px);
}

.text {
  @apply mt-4;
}
</style>
