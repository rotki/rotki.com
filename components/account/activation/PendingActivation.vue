<template>
  <page>
    <template #title> Almost Done </template>
    <div :class="$style.body">
      <p :class="$style.header">Thank you for registering.</p>
      <p>
        To use your new rotki account you have to first confirm your e-mail.
      </p>
      <p>
        Please check your mailbox and follow the instructions to activate your
        account.
      </p>
    </div>
  </page>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'PendingActivation',
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
