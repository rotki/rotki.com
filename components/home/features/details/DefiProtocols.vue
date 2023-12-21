<script setup lang="ts">
const { t } = useI18n();
const defi = [
  {
    name: 'Maker DAO',
    img: '/img/defi/makerdao.png',
  },
  {
    name: 'AAVE',
    img: '/img/defi/aave.png',
  },
  {
    name: 'Compound',
    img: '/img/defi/compound.png',
  },
  {
    name: 'Yearn Finance',
    img: '/img/defi/yearn.png',
  },
  {
    name: 'Uniswap',
    img: '/img/defi/uniswap.png',
  },
  {
    name: 'Balancer',
    img: '/img/defi/balancer.png',
  },
  {
    name: 'Adex',
    img: '/img/defi/adex.svg',
  },
  {
    name: 'Liquity',
    img: '/img/defi/liquity.png',
  },
  {
    name: 'Sushiswap',
    img: '/img/defi/sushiswap.svg',
  },
];
</script>

<template>
  <div class="flex flex-1 flex-col gap-4">
    <h6 class="text-h6 text-rui-primary">
      {{ t('home.defi.title') }}
    </h6>
    <h4 class="text-h4">{{ t('home.defi.detail') }}</h4>
  </div>
  <div class="pt-8">
    <div class="grid sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
      <div
        v-for="item in defi"
        :key="item.name"
        class="flex items-center gap-3 text-subtitle-1 font-bold"
      >
        <div class="w-8 h-8 rounded-full overflow-hidden">
          <img :src="item.img" :alt="item.name" class="w-full h-full" />
        </div>
        {{ item.name }}
      </div>
    </div>
  </div>
</template>
