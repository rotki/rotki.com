<template>
  <div class="premium-feature">
    <div class="premium-feature__title">
      <slot name="title"></slot>
    </div>
    <div class="premium-feature__details">
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

<style scoped>
.premium-feature {
  @apply font-bold font-serif text-white flex flex-col col-span-6 flex-shrink;

  margin-top: 5.75rem;
  font-size: 2rem;
  line-height: 2.938rem;
  letter-spacing: -0.01em;
  max-width: 31rem;
}

.premium-feature__title {
  margin-bottom: 2.375rem;
}

.premium-feature__details {
  @apply font-sans font-light text-white;

  font-size: 1.5rem;
  line-height: 1.875rem;
}
</style>
