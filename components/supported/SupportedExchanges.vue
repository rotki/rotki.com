<template>
  <div class="py-12">
    <TextHeading>{{ t('supported_exchanges.title') }}</TextHeading>
    <SupportedRowWrapper :items="exchanges" />
  </div>
</template>
<script setup lang="ts">
const exchanges = [
  {
    name: 'Kraken',
    img: '/img/exchanges/kraken.svg',
  },
  {
    name: 'Poloniex',
    img: '/img/exchanges/poloniex.svg',
  },
  {
    name: 'Bitmex',
    img: '/img/exchanges/bitmex.svg',
  },
  {
    name: 'Bitpanda',
    img: '/img/exchanges/bitpanda.svg',
  },
  {
    name: 'Binance',
    img: '/img/exchanges/binance.svg',
  },
  {
    name: 'Binance US',
    img: '/img/exchanges/binance.svg',
  },
  {
    name: 'Bittrex',
    img: '/img/exchanges/bittrex.svg',
  },
  {
    name: 'Bitfinex',
    img: '/img/exchanges/bitfinex.svg',
  },
  {
    name: 'bitcoin.de',
    img: '/img/exchanges/btcde.svg',
  },
  {
    name: 'Iconomi',
    img: '/img/exchanges/iconomi.svg',
  },
  {
    name: 'Gemini',
    img: '/img/exchanges/gemini.svg',
  },
  {
    name: 'Coinbase',
    img: '/img/exchanges/coinbase.svg',
  },
  {
    name: 'Coinbase Pro',
    img: '/img/exchanges/coinbasepro.svg',
  },
  {
    name: 'Bitstamp',
    img: '/img/exchanges/bitstamp.svg',
  },
  {
    name: 'KuCoin',
    img: '/img/exchanges/kucoin.svg',
  },
  {
    name: 'FTX',
    img: '/img/exchanges/ftx.svg',
  },
  {
    name: 'FTX US',
    img: '/img/exchanges/ftxus.svg',
  },
  {
    name: 'Independent Reserve',
    img: '/img/exchanges/independentreserve.svg',
  },
]

const { t } = useI18n()
</script>
