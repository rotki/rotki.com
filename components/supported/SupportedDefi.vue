<script setup lang="ts">
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

const { t } = useI18n();
</script>

<template>
  <div id="defi" class="py-12">
    <TextHeading>{{ t('supported_defi.title') }}</TextHeading>
    <SupportedRowWrapper :items="defi" />
    <CaptionText>{{ t('supported_defi.caption') }}</CaptionText>
  </div>
</template>
