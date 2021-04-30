<template>
  <feature id="eth2-staking" :sticky="sticky">
    <template #title> Eth2 staking</template>
    <template #image>
      <img
        alt="Ethereum"
        src="~/assets/img/ethereum.svg"
        :class="$style.image"
      />
    </template>
    <feature-details>
      Premium users can set watchers for various protocol so that they can be
      informed via email when certain conditions are met.
    </feature-details>
    <div :class="$style.button">
      <download-button @click="$emit('download')" />
    </div>
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
  width: $image-width;
  height: $image-height;

  @include for-size(phone-only) {
    width: $image-width;
    height: $image-height;
    padding-bottom: 120px;
  }

  @include for-size(desktop-up) {
    position: absolute;
    right: 100px;
  }
}

.button {
  @include for-size(phone-only) {
    @include margin-x(auto);
  }
}
</style>
