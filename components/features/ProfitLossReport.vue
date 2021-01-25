<template>
  <feature id="profitlossreport">
    <template #title> Profit/Loss Report </template>
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
