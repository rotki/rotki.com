<template>
  <page>
    <template #title>Password Change</template>
    <div :class="$style.body">
      <p :class="$style.header">Password changed.</p>
      <div>
        Your password changed successfully, you can now access your
        <external-link same-tab text="account" url="/home" />.
      </div>
    </div>
  </page>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'PasswordChanged',
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
