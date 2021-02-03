<template>
  <feature id="eth2-staking">
    <template #title> Eth2 staking</template>
    <template #image>
      <img src="~/assets/img/ethereum.svg" :class="$style.image" />
    </template>
    <feature-details>
      Premium users can set watchers for various protocol so that they can be
      informed via email when certain conditions are met.
    </feature-details>
  </feature>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Eth2Staking',
})
</script>

<style module>
.image {
  width: 10.66666rem;
  height: 17.33333rem;
  margin-left: 9rem;

  @media only screen and (min-width: 2200px) {
    margin-left: 19rem;
  }
  @media only screen and (min-width: 3000px) {
    right: 45rem;
  }
  @media only screen and (max-width: 855px) {
    padding-bottom: 4rem;
  }
}
</style>
