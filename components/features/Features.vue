<template>
  <div :class="$style.wrapper">
    <anchor id="features" />
    <middle-menu />
    <dashboard />
    <exchanges />
    <defi />
    <defi-details />
    <Eth2Staking />
    <ProfitLossReport :class="$style.last" />
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Features',
})
</script>

<style module>
.wrapper {
  @apply container mx-auto;
}

.last {
  margin-left: 23.8rem;
  padding-bottom: 4.8rem;

  @media only screen and (max-width: 767px) {
    margin-left: 0;
  }

  @media only screen and (min-width: 768px) and (max-width: 1023px) {
    margin-left: 10rem;
  }
}
</style>
