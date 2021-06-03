<template>
  <feature id="dashboard">
    <template #title> A 360° overview of your assets</template>
    <template #image>
      <img
        alt="Rotki Dashboard"
        src="~/assets/img/dashboard.png"
        :class="$style.image"
      />
    </template>
    <feature-details>
      <template #subtitle> Assets and Liabilities </template>
      View all of your assets and liabilities and your exposure to each as a
      percentage of your net worth.
    </feature-details>
    <feature-details>
      <template #subtitle> Net worth over time</template>
      Users can also see a graph of how their total net worth is evolving over
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
    right: -400px;
  }
}
</style>
