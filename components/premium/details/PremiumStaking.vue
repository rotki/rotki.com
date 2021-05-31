<template>
  <premium-feature>
    <template #title> Advanced Staking </template>
    <div>
      <div>See how much ETH was staked per address</div>
      <div>how much is their expected APR</div>
      <div>how much ETH you have earned by staking</div>
    </div>
    <div class="mt-8">
      See a list of all your Eth2, and AdEx staking deposits and links to the
      corresponding transactions.
    </div>
  </premium-feature>
</template>
<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'PremiumStaking',
})
</script>
