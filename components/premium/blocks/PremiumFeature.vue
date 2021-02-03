<template>
  <div :class="$style.wrapper">
    <div :class="$style.title">
      <slot name="title"></slot>
    </div>
    <div :class="$style.description">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'PremiumFeature',
})
</script>

<style module>
.wrapper {
  @apply flex flex-col col-span-6 flex-shrink;

  margin-top: 5.75rem;
  max-width: 29rem;
}

.title {
  @apply font-bold font-serif text-white;

  margin-bottom: 2.375rem;
  font-size: 1.77777rem;
  line-height: 2.61111rem;
  letter-spacing: -0.01em;
}

.description {
  @apply font-sans font-light text-white;

  font-size: 1.33333rem;
  line-height: 1.67611rem;
}
</style>
