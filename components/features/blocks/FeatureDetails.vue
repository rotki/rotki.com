<template>
  <div :class="$style.wrapper">
    <div :class="$style.column">
      <div v-if="$slots.subtitle" :class="$style.subtitle">
        <slot name="subtitle" />
      </div>
      <div :class="$style.description">
        <slot />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'FeatureDetails',
})
</script>

<style module>
.wrapper {
  @apply flex flex-row;

  margin-bottom: 5rem;
}

.column {
  @apply flex flex-col;
}

.subtitle {
  @apply flex flex-row font-serif font-bold text-primary2;

  font-size: 1.388888rem;
  line-height: 2.555556rem;
  letter-spacing: -0.01em;
  margin-bottom: 0.88888rem;
}

.description {
  @apply flex flex-row font-sans text-primary2;

  font-size: 1.33333rem;
  line-height: 1.777777rem;
}
</style>
