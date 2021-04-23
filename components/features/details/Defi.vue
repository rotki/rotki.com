<template>
  <feature id="defi" :sticky="sticky">
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
  props: {
    sticky: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      defi: ['MakerDAO', 'Aave', 'Compound', 'Yearn vaults', 'Uniswap'],
    }
  },
})
</script>

<style module lang="scss">
@import '~assets/css/media';
@import '~assets/css/main';

$width: 732px;
$height: 506px;

.image {
  width: $width;
  height: $height;
  z-index: -1;
  position: absolute;
  margin-top: 38px;
  right: -50px;

  @include for-size(phone-only) {
    position: relative;
    right: 0;
    width: $width * $mobile-image-percentage;
    height: $height * $mobile-image-percentage;
  }
}
</style>
