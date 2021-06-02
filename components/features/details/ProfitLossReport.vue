<template>
  <feature id="profitloss-report">
    <template #title> Profit/Loss Report </template>
    <template #image>
      <img
        alt="Cryptocurrencies"
        src="~/assets/img/crypto.svg"
        :class="$style.image"
      />
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
})
</script>

<style module lang="scss">
@import '~assets/css/media';
@import '~assets/css/main';

.image {
  z-index: -1;

  @include for-size(phone-only) {
    position: relative;
    right: 0;
  }

  @include for-size(tablet-portait-up) {
    position: relative;
  }

  @include for-size(desktop-up) {
    position: absolute;
    margin-top: 40px;
    right: -80px;
  }
}
</style>
