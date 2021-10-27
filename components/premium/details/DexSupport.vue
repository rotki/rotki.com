<template>
  <premium-feature>
    <template #title> Decentralized Exchanges </template>
    <div>
      See how much you have in each liquidity pool. All your Uniswap and
      Balancer LP join/exit events are shown along with the total profit/loss
      per pool.
    </div>
    <div class="mt-8">
      Uniswap and Balancer trades are taken into account in the tax report for
      premium users.
    </div>
  </premium-feature>
</template>
<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'DexSupport',
})
</script>
