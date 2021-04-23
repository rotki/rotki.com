<template>
  <feature id="dashboard" :sticky="sticky">
    <template #title> Dashboard 360 degree overview of your holdings </template>
    <template #image>
      <div>
        <img src="~/assets/img/macbook.png" :class="$style.image" />
      </div>
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
  props: {
    sticky: {
      type: Boolean,
      required: true,
    },
  },
})
</script>

<style module>
.image {
  position: absolute;

  @media only screen and (max-width: 767px) {
    position: relative;
    margin-bottom: 60px;
  }

  @media only screen and (min-width: 1440px) {
    right: -200px;
  }
  @media only screen and (min-width: 3000px) {
    right: 200px;
  }

  @media only screen and (min-width: 768px) and (max-width: 1440px) {
    right: -460px;
  }
}
</style>
