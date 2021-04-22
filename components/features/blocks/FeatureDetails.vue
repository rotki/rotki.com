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

  margin-bottom: 40px;
}

.column {
  @apply flex flex-col;
}

.subtitle {
  @apply flex flex-row font-serif font-bold text-primary2;

  font-size: 25px;
  line-height: 46px;
  letter-spacing: -0.01em;
  margin-top: 58px;
  margin-bottom: 16px;
}

.description {
  @apply flex flex-row font-sans text-primary2;

  font-size: 24px;
  line-height: 32px;
}
</style>
