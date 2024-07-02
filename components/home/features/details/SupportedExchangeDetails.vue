<script setup lang="ts">
const { t } = useI18n();
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
    name: 'Bitmex',
    img: '/img/exchanges/bitmex.svg',
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
    name: 'Independent Reserve',
    img: '/img/exchanges/independentreserve.svg',
  },
  {
    name: 'Okx',
    img: '/img/exchanges/okx.svg',
  },
  {
    name: 'Woo',
    img: '/img/exchanges/woo.svg',
  },
  {
    name: 'Bybit',
    img: '/img/exchanges/bybit.svg',
  },
];
</script>

<template>
  <div class="flex flex-col-reverse lg:flex-row items-center gap-10 md:gap-20">
    <div class="flex flex-1 flex-col gap-4">
      <h6 class="text-h6 text-rui-primary">
        {{ t('home.exchanges.title') }}
      </h6>
      <h4 class="text-h4">
        {{ t('home.exchanges.subtitle') }}
      </h4>
      <div class="text-body-1 text-rui-text-secondary pt-2">
        {{ t('home.exchanges.detail') }}
      </div>
      <div class="pt-4">
        <div
          class="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          <div
            v-for="item in exchanges"
            :key="item.name"
            class="flex items-center gap-3 text-subtitle-1 font-bold"
          >
            <div class="w-8 h-8 rounded-full overflow-hidden">
              <img
                :src="item.img"
                :alt="item.name"
                class="w-full h-full"
              />
            </div>
            {{ item.name }}
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1">
      <img
        class="overflow-hidden"
        :alt="t('home.exchanges.title')"
        src="/img/exchanges.png"
      />
    </div>
  </div>
</template>
