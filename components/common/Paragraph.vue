<template>
  <p :class="$style.text">
    <slot />
  </p>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Paragraph',
})
</script>

<style module>
.text {
  @apply font-sans text-shade11 text-justify;

  margin-top: 16px;
}
</style>
