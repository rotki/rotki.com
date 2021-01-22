<template>
  <div :class="$style.wrapper">
    <div>
      <div :class="$style.header">Start using Rotki today!</div>
    </div>
    <div :class="$style.content">
      <free-plan />
      <basic-plan />
      <advanced-plan />
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Plans',
})
</script>

<style module>
.wrapper {
  @apply container mx-auto;

  margin-top: 7.6875rem;
  padding-bottom: 4.25rem;
}

.header {
  @apply font-bold font-serif text-primary2;

  text-align: center;
  letter-spacing: -0.03em;
  font-size: 5.25rem;
  line-height: 6.75rem;
  margin-bottom: 5.8125rem;
}

.content {
  @apply flex-wrap flex-row flex lg:justify-around justify-center;
}
</style>
