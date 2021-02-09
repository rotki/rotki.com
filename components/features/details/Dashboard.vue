<template>
  <feature id="dashboard">
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
      View all of the assets and liabilities you own, how much of each and the
      total % the asset consists of your net worth. Users can also see a graph
      of how their total networth is faring over time. Free users are limited to
      the last 2 weeks.
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

<style module>
.image {
  position: absolute;
  right: -25rem;

  @media only screen and (min-width: 2200px) {
    right: 10rem;
  }
  @media only screen and (min-width: 3000px) {
    right: 25rem;
  }
  @media only screen and (max-width: 768px) {
    position: relative;
  }
}
</style>
