<template>
  <fragment>
    <anchor id="features" />
    <middle-menu />
    <div
      :class="{
        [$style.wrapper]: true,
      }"
    >
      <div>
        <dashboard @download="$emit('download')" />
        <exchanges />
        <defi />
        <defi-details />
        <Eth2Staking @download="$emit('download')" />
        <ProfitLossReport :class="$style.last" />
      </div>
    </div>
  </fragment>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Features',
})
</script>

<style module lang="scss">
@import '~assets/css/media';
@import '~assets/css/main';

.wrapper {
  @apply container mx-auto;
}

.last {
  @include for-size(phone-only) {
    margin-left: 0;
  }

  @include for-size(tablet-portrait-up) {
    margin-left: 0;
  }

  @include for-size(tablet-landscape-up) {
    margin-left: 280px !important;
    margin-bottom: -150px;
  }

  @include for-size(desktop-up) {
    margin-left: 280px;
    margin-bottom: -150px;
  }
}
</style>
