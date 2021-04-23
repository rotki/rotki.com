<template>
  <feature id="eth2-staking" :sticky="sticky">
    <template #title> Eth2 staking</template>
    <template #image>
      <img src="~/assets/img/ethereum.svg" :class="$style.image" />
    </template>
    <feature-details>
      Premium users can set watchers for various protocol so that they can be
      informed via email when certain conditions are met.
    </feature-details>
    <download-button />
  </feature>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Eth2Staking',
  props: {
    sticky: {
      type: Boolean,
      required: true,
    },
  },
})
</script>

<style module lang="scss">
@import '~assets/css/media';
@import '~assets/css/main';

$image-width: 192px;
$image-height: 312px;

.image {
  margin-top: -55px;
  margin-left: 174px;
  width: $image-width;
  height: $image-height;

  @include for-size(phone-only) {
    margin-top: 0;
    margin-left: auto;
    margin-right: auto;
    width: $image-width;
    height: $image-height;
  }

  @media only screen and (max-width: 755px) {
    padding-bottom: 120px;
  }

  @media only screen and (min-width: 756px) and (max-width: 1600px) {
    position: absolute;
    margin-left: 0;
  }
}
</style>
