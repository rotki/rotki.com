<template>
  <feature id="defi">
    <template #title> DeFi </template>
    <template #image>
      <img
        alt="DeFi protocols"
        src="~/assets/img/defi.png"
        :class="$style.image"
      />
    </template>
    <feature-details>
      Overview of all of your DeFi holdings in various protocols, historical
      activity details and profit loss calculation.
    </feature-details>
    <div :class="$style['list-container']">
      <item-list :list="defi" />
    </div>
    <Caption>
      * This is but a subset of the supported protocols
    </Caption>
  </feature>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Defi',
  data() {
    return {
      defi: [
        'MakerDAO',
        'Aave',
        'Compound',
        'Yearn vaults',
        'Uniswap',
        'Balancer',
      ],
    }
  },
})
</script>

<style module lang="scss">
@import '~assets/css/media';
@import '~assets/css/main';

.image {
  z-index: -1;
  @include for-size(phone-only) {
    width: 100%;
    position: relative;
    right: 0;
  }

  @include for-size(tablet-portrait-up) {
    position: relative;
    margin-bottom: 60px;
  }

  @include for-size(tablet-landscape-up) {
    max-width: 732px;
  }

  @include for-size(desktop-up) {
    position: absolute;
    margin-top: 38px;
    right: -200px;
  }
}
</style>
