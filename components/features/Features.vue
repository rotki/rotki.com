<template>
  <div :class="$style.wrapper">
    <anchor id="features" />
    <middle-menu />
    <dashboard @download="$emit('download')" />
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
  margin-left: 280px;
  padding-bottom: 134px;

  @media only screen and (max-width: 767px) {
    margin-left: 0;
  }
}
</style>
