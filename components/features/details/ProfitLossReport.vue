<template>
  <feature id="profitloss-report" :sticky="sticky">
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

export default Vue.extend({
  name: 'ProfitLossReport',
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
  margin-top: -125px;
  right: -45px;
  z-index: -1;

  @media only screen and (min-width: 2200px) {
    position: relative;
    right: -300px;
  }

  @include for-size(phone-only) {
    position: relative;
    right: 0;
  }
}
</style>
