<template>
  <div :class="$style.wrapper">
    <div>
      <div :class="$style.header">Start using Rotki today!</div>
    </div>
    <div :class="$style.content">
      <free-plan />
      <basic-plan />
      <advanced-plan />
      <custom-plan />
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

  margin-top: 6.83333rem;
  padding-bottom: 1.2rem;
}

.header {
  @apply font-bold font-serif text-primary2;

  text-align: center;
  letter-spacing: -0.03em;
  font-size: 4.66666rem;
  line-height: 6rem;
}

.content {
  @apply flex-wrap flex-row flex lg:justify-around justify-center;
}
</style>
