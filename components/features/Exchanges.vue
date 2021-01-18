<template>
  <feature>
    <template #title>
      Connect to a big number of centralized exchanges
    </template>
    <div class="flex flex-row feature-details feature-description">
      Connect to a big number of centralized exchanges and inspect current
      balances, historical trades, deposits and withdrawals.
    </div>
    <div class="flex flex-row">
      <div class="flex flex-col col-span-6">
        <ul class="feature-list">
          <li>Kraken</li>
          <li>Poloniex</li>
          <li>Bittrex</li>
          <li>Binance</li>
        </ul>
      </div>
      <div class="flex flex-col col-span-6">
        <ul class="feature-list">
          <li>Bitmex</li>
          <li>Coinbase</li>
          <li>Coinbase Pro</li>
          <li>Gemini</li>
        </ul>
      </div>
    </div>
    <div class="flex flex-row feature-caption mt-16">
      * More exchanges are being supported with new releases of Rotki.
    </div>
  </feature>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({})
</script>
