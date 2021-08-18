<template>
  <page>
    <template #title>Password recovery</template>
    <div :class="$style.body">
      <p :class="$style.header">Please check your email</p>
      <p>A recovery link has been send to your account's address.</p>
      <p>Please check your mailbox to proceed.</p>
    </div>
  </page>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'PasswordLinkSend',
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
