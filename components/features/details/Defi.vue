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
  width: 732px;
  height: 506px;
  position: absolute;
  margin-top: 38px;
  right: -50px;

  @media only screen and (min-width: 2000px) {
    right: 120px;
  }

  @media only screen and (min-width: 3000px) {
    right: 620px;
  }

  @media only screen and (max-width: 768px) {
    right: 0;
    left: 0;
    height: 207px;
    width: 300px;
    position: relative;
    margin-bottom: 48px;
  }
}
</style>
