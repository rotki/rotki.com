<template>
  <fragment>
    <anchor id="features" />
    <middle-menu @sticky="sticky = $event" />
    <div
      :class="{
        [$style.wrapper]: true,
      }"
    >
      <dashboard :sticky="sticky" @download="$emit('download')" />
      <exchanges :sticky="sticky" />
      <defi :sticky="sticky" />
      <defi-details :sticky="sticky" />
      <Eth2Staking :sticky="sticky" />
      <ProfitLossReport :sticky="sticky" :class="$style.last" />
    </div>
  </fragment>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Features',
  data() {
    return {
      sticky: false,
    }
  },
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
