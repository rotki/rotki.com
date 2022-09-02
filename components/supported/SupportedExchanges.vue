<template>
  <div class="py-12">
    <heading>{{ $t('supported_exchanges.title') }}</heading>
    <supported-row-wrapper :items="exchanges" />
  </div>
</template>
<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'SupportedExchanges',
  setup() {
    const exchanges = [
      {
        name: 'Kraken',
        img: require('~/assets/img/exchanges/kraken.svg'),
      },
      {
        name: 'Poloniex',
        img: require('~/assets/img/exchanges/poloniex.svg'),
      },
      {
        name: 'Bitmex',
        img: require('~/assets/img/exchanges/bitmex.svg'),
      },
      {
        name: 'Bitpanda',
        img: require('~/assets/img/exchanges/bitpanda.svg'),
      },
      {
        name: 'Binance',
        img: require('~/assets/img/exchanges/binance.svg'),
      },
      {
        name: 'Binance US',
        img: require('~/assets/img/exchanges/binance.svg'),
      },
      {
        name: 'Bittrex',
        img: require('~/assets/img/exchanges/bittrex.svg'),
      },
      {
        name: 'Bitfinex',
        img: require('~/assets/img/exchanges/bitfinex.svg'),
      },
      {
        name: 'bitcoin.de',
        img: require('~/assets/img/exchanges/btcde.svg'),
      },
      {
        name: 'Iconomi',
        img: require('~/assets/img/exchanges/iconomi.svg'),
      },
      {
        name: 'Gemini',
        img: require('~/assets/img/exchanges/gemini.svg'),
      },
      {
        name: 'Coinbase',
        img: require('~/assets/img/exchanges/coinbase.svg'),
      },
      {
        name: 'Coinbase Pro',
        img: require('~/assets/img/exchanges/coinbasepro.svg'),
      },
      {
        name: 'Bitstamp',
        img: require('~/assets/img/exchanges/bitstamp.svg'),
      },
      {
        name: 'KuCoin',
        img: require('~/assets/img/exchanges/kucoin.svg'),
      },
      {
        name: 'FTX',
        img: require('~/assets/img/exchanges/ftx.svg'),
      },
      {
        name: 'FTX US',
        img: require('~/assets/img/exchanges/ftxus.svg'),
      },
      {
        name: 'Independent Reserve',
        img: require('~/assets/img/exchanges/independentreserve.svg'),
      },
    ]

    return {
      exchanges,
    }
  },
})
</script>
