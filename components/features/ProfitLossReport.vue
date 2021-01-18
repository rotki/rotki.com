<template>
  <feature>
    <template #title> Profit/Loss Report </template>
    <div class="flex flex-row feature-details">
      <div class="flex flex-col">
        <div class="flex flex-row feature-description">
          A profit/loss report across all the user’s assets, protocols,
          exchanges and blockchains is created for the given time range. The
          results can be exported into a CSV file which is can later be imported
          to a spreadsheet or shared directly with your accountant.
        </div>
        <div class="flex flex-row feature-description mt-16">
          Profit/Loss report for free users is more limited and does not take
          into account all possible protocols.
        </div>
      </div>
    </div>
  </feature>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({})
</script>
