<template>
  <feature id="defi">
    <template #title> DeFi </template>
    <template #image>
      <img src="~/assets/img/defi.png" :class="$style.image" />
    </template>
    <feature-details>
      Overview of all of your DeFi holdings in various protocols, historical
      activity details and profit loss calculation.
    </feature-details>
    <div :class="$style['list-container']">
      <item-list :list="defi" />
    </div>
    <Caption>
      * More protocols are being supported with new releases of Rotki.
    </Caption>
  </feature>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Defi',
  data() {
    return {
      defi: ['MakerDAO', 'Aave', 'Compound', 'Yearn vaults', 'Uniswap'],
    }
  },
})
</script>

<style module>
.image {
  z-index: -1;
  width: 40.66666rem;
  height: 28.11111rem;
  position: absolute;
  margin-top: 1rem;
  right: -3rem;

  @media only screen and (min-width: 2200px) {
    position: relative;
    right: -10rem;
  }

  @media only screen and (max-width: 768px) {
    position: relative;
  }
}
</style>
