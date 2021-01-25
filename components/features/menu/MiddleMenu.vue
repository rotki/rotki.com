<template>
  <div
    id="features"
    class="flex flex-row font-sans text-2xl justify-center font-light"
  >
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
      <a href="#defidetails">Ethereum Protocols</a>
    </div>
    <div class="flex-col w-56">
      <a href="#eth2staking">ETH2 Staking</a>
    </div>
    <div class="flex-col w-56">
      <a href="#profitlossreport">Profit/Loss Report</a>
    </div>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'MiddleMenu',
})
</script>
