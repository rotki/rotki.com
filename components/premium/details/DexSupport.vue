<template>
  <premium-feature>
    <template #title> Decentralized Exchanges </template>
    <div>
      See how much you have in each pool, all your Uniswap and Balancer LP
      burn/mint events are shown along with the total profit loss.
    </div>
    <div class="mt-8">
      Uniswap and Balancer trades are taken into account in the tax report for
      premium users.and all profit and loss is calculated in the given time
      range.
    </div>
  </premium-feature>
</template>
<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'DexSupport',
})
</script>
