<template>
  <div id="defi" class="py-12">
    <heading>{{ $t('supported_defi.title') }}</heading>
    <supported-row-wrapper :items="defi" />
    <Caption>{{ $t('supported_defi.caption') }}</Caption>
  </div>
</template>
<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'SupportedDefi',
  setup() {
    const defi = [
      {
        name: 'Maker DAO',
        img: require('~/assets/img/defi/makerdao.png'),
      },
      {
        name: 'AAVE',
        img: require('~/assets/img/defi/aave.png'),
      },
      {
        name: 'Compound',
        img: require('~/assets/img/defi/compound.png'),
      },
      {
        name: 'Yearn Finance',
        img: require('~/assets/img/defi/yearn.png'),
      },
      {
        name: 'Uniswap',
        img: require('~/assets/img/defi/uniswap.png'),
      },
      {
        name: 'Balancer',
        img: require('~/assets/img/defi/balancer.png'),
      },
      {
        name: 'Adex',
        img: require('~/assets/img/defi/adex.svg'),
      },
      {
        name: 'Liquity',
        img: require('~/assets/img/defi/liquity.png'),
      },
      {
        name: 'Sushiswap',
        img: require('~/assets/img/defi/sushiswap.svg'),
      },
    ]

    return {
      defi,
    }
  },
})
</script>
