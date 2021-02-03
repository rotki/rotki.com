<template>
  <feature id="profitloss-report">
    <template #title> Profit/Loss Report </template>
    <template #image>
      <img src="~/assets/img/crypto.svg" :class="$style.image" />
    </template>
    <feature-details>
      A profit/loss report across all the user’s assets, protocols, exchanges
      and blockchains is created for the given time range. The results can be
      exported into a CSV file which is can later be imported to a spreadsheet
      or shared directly with your accountant.
    </feature-details>
    <feature-details>
      Profit/Loss report for free users is more limited and does not take into
      account all possible protocols.
    </feature-details>
  </feature>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({})
</script>

<style module>
.image {
  width: 20.5rem;
  height: 16.11111rem;
  position: absolute;
  margin-top: -5.5rem;
  right: -5rem;
  z-index: -1;

  @media only screen and (min-width: 2200px) {
    position: relative;
    right: -10rem;
  }

  @media only screen and (max-width: 855px) {
    position: relative;
    right: 0;
  }
}
</style>
