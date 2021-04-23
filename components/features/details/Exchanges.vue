<template>
  <feature id="exchanges" :sticky="sticky">
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
    <div :class="$style.list">
      <item-list :list="column1" />
      <item-list :list="column2" />
    </div>
    <Caption>
      * More exchanges are being supported with new releases of Rotki.
    </Caption>
  </feature>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'Exchanges',
  props: {
    sticky: {
      type: Boolean,
      required: true,
    },
  },
  data() {
    return {
      column1: ['Kraken', 'Poloniex', 'Bittrex', 'Binance'],
      column2: ['Bitmex', 'Coinbase', 'Coinbase Pro', 'Gemini'],
    }
  },
})
</script>

<style module>
.image {
  z-index: -1;
  width: 755px;
  height: 527px;
  position: absolute;
  margin-top: -60px;
  right: -93px;

  @media only screen and (min-width: 2200px) {
    position: relative;
    right: 0;
  }
  @media only screen and (min-width: 3000px) {
    position: relative;
    right: 0;
  }
  @media only screen and (max-width: 855px) {
    position: relative;
    right: 0;
  }
}

.list {
  @apply flex flex-row justify-between;

  padding-right: 120px;
}
</style>
