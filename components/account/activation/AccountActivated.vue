<template>
  <page>
    <template #title> Account Activated </template>
    <div :class="$style.body">
      <p :class="$style.header">Welcome to rotki</p>
      <p>Your rotki account has been successfully activated.</p>
      <p>
        To see your dashboard click
        <external-link same-tab text="here" url="/home" />
      </p>
    </div>
  </page>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'AccountActivated',
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
