<template>
  <fragment>
    <anchor id="features" />
    <middle-menu @sticky="sticky = $event" />
    <div
      :class="{
        [$style.wrapper]: true,
      }"
    >
      <div>
        <dashboard :sticky="sticky" @download="$emit('download')" />
        <exchanges :sticky="sticky" />
        <defi :sticky="sticky" />
        <defi-details :sticky="sticky" />
        <Eth2Staking :sticky="sticky" @download="$emit('download')" />
        <ProfitLossReport :sticky="sticky" :class="$style.last" />
      </div>
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
