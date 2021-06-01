<template>
  <feature id="dashboard">
    <template #title> Dashboard 360 degree overview of your holdings </template>
    <template #image>
      <img
        alt="Rotki Dashboard"
        src="~/assets/img/dashboard.png"
        :class="$style.image"
      />
    </template>
    <feature-details>
      <template #subtitle> Assets and Liabilities </template>
      View all of the assets and liabilities you own, how much of each and the
      total % the asset consists of your net worth.
    </feature-details>
    <feature-details>
      <template #subtitle> Networth fairing </template>
      Users can also see a graph of how their total networth is faring over
      time. Free users are limited to the last 2 weeks.
    </feature-details>
    <div class="flex flex-row">
      <download-button @click="$emit('download')" />
    </div>
  </feature>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Dashboard',
})
</script>

<style module lang="scss">
@import '~assets/css/media';
@import '~assets/css/main';

.image {
  @include for-size(phone-only) {
    position: relative;
    margin-bottom: 60px;
  }

  @include for-size(tablet-portrait-up) {
    position: relative;
    margin-bottom: 60px;
  }

  @include for-size(desktop-up) {
    top: 80px;
    position: absolute;
    right: -600px;
  }

  @include for-size(big-desktop-up) {
    right: -300px;
  }
}
</style>
