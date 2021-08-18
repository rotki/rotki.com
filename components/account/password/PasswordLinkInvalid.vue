<template>
  <page>
    <template #title>Invalid Link</template>
    <div :class="$style.body">
      <p :class="$style.header">Invalid password reset link.</p>
      <p>
        The link you followed doesn't seem like a valid password reset link.
      </p>
    </div>
  </page>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'PasswordLinkInvalid',
  setup() {},
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
