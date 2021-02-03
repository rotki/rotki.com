<template>
  <div :class="$style.menu">
    <div class="flex-col w-48">
      <a href="#dashboard">Dashboard</a>
    </div>
    <div class="flex-col w-48">
      <a href="#exchanges">Exchanges</a>
    </div>
    <div class="flex-col w-48">
      <a href="#defi">DeFi</a>
    </div>
    <div class="flex-col w-56">
      <a href="#defi-details">Ethereum Protocols</a>
    </div>
    <div class="flex-col w-56">
      <a href="#eth2-staking">ETH2 Staking</a>
    </div>
    <div class="flex-col w-56">
      <a href="#profitloss-report">Profit/Loss Report</a>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'MiddleMenu',
})
</script>

<style module>
.menu {
  @apply flex flex-row font-sans text-2xl justify-center font-light;
}
</style>
