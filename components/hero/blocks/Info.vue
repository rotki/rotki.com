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
import Vue from 'vue'

export default Vue.extend({
  name: 'Info',
})
</script>

<style module>
.wrapper {
  @apply flex flex-row justify-center;
}

.title {
  @apply flex-col font-serif text-primary2 text-4xl;

  font-size: 32px;
  line-height: 47px;
  letter-spacing: -0.01em;
}

.subtitle {
  @apply flex-col font-sans text-primary2 text-center;

  font-size: 24px;
  line-height: 30px;
}

.bottom {
  @apply flex flex-row justify-center;

  margin-top: 25px;
  max-width: 290px;
}
</style>
