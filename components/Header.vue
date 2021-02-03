<template>
  <div :class="$style.wrapper">
    <div :class="$style.header">
      <div :class="$style.title">Rotki</div>
    </div>
    <div :class="$style.links">
      <links />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Header',
})
</script>

<style module>
.wrapper {
  @apply container mx-auto;
}

.header {
  @apply mt-24 flex flex-row justify-center;
}

.title {
  @apply header text-primary font-serif flex-col col-auto text-5xl;
}

.links {
  @apply flex flex-row justify-center;

  margin-top: 2.7777rem;
}
</style>
