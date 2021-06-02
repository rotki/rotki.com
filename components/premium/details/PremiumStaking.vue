<template>
  <premium-feature>
    <template #title> Advanced Staking </template>
    <div>
      <div>See how much of the token is staked per account.</div>
      <div>What is the expected APR.</div>
      <div>How much of the token you have earned by staking across all accounts.</div>
    </div>
    <div class="mt-8">
      See a list of all your staking events with links to the corresponding transactions.
    </div>
  </premium-feature>
</template>
<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'PremiumStaking',
})
</script>
