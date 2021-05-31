<template>
  <feature id="exchanges" :sticky="sticky">
    <template #title>
      Connect to a big number of centralized exchanges
    </template>
    <template #image>
      <img
        alt="Supported Exchanges"
        src="~/assets/img/exchanges.png"
        :class="$style.image"
      />
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
      column1: ['Kraken', 'KuCoin', 'Binance', 'Poloniex', 'Bittrex'],
      column2: ['FTX', 'Coinbase', 'Coinbase Pro', 'Gemini', 'Bitmex'],
    }
  },
})
</script>

<style module lang="scss">
@import '~assets/css/media';
@import '~assets/css/main';

.image {
  z-index: -1;
  position: absolute;

  @include for-size(phone-only) {
    max-width: 100%;
    position: relative;
    right: 0;
  }

  @include for-size(tablet-portrait-up) {
    position: relative;
    max-width: 100%;
    top: 0;
  }

  @include for-size(tablet-landscape-up) {
    margin-top: -60px;
    right: -93px;
    max-width: 755px;
  }

  @include for-size(desktop-up) {
    position: absolute;
    right: -150px;
  }
}

.list {
  @apply flex flex-row justify-between;

  padding-right: 120px;

  @include for-size(phone-only) {
    padding-right: 40px;
  }
}
</style>
