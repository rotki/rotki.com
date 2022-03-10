<template>
  <div>
    <div :class="$style.wrapper">
      <div :class="$style.title">
        <slot name="title" />
      </div>
    </div>
    <div :class="$style.bottom">
      <div :class="$style.subtitle">
        <slot />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'Info',
})
</script>

<style lang="scss" module>
@import '~assets/css/media';
@import '~assets/css/main';

.wrapper {
  @apply flex flex-row justify-center;
}

.title {
  @apply flex-col font-serif text-primary2 text-4xl font-bold;

  letter-spacing: -0.01em;

  @include text-size(32px, 47px);
}

.subtitle {
  @apply flex-col font-sans text-primary2 text-center;

  @include text-size(24px, 30px);
}

.bottom {
  @apply flex flex-row justify-center;

  margin-top: 25px;
  max-width: 350px;
}
</style>
