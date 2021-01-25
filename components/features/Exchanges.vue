<template>
  <feature id="exchanges">
    <template #title>
      Connect to a big number of centralized exchanges
    </template>
    <template #image>
      <div>
        <img src="~/assets/img/exchanges.png" :class="$style.image" />
      </div>
    </template>
    <feature-details>
      Connect to a big number of centralized exchanges and inspect current
      balances, historical trades, deposits and withdrawals.
    </feature-details>
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

<style module>
.image {
  width: 41.94rem;
  height: 29.26666rem;
  position: absolute;
  margin-top: -4.5rem;
  right: -5rem;

  @media only screen and (min-width: 2200px) {
    right: 10rem;
  }
  @media only screen and (min-width: 3000px) {
    right: 25rem;
  }
  @media only screen and (max-width: 855px) {
    position: relative;
  }
}
</style>
