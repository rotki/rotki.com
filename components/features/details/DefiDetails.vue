<template>
  <feature id="defi-details" :sticky="sticky">
    <template #title> Ethereum DeFi protocol details </template>
    <feature-details>
      Details per protocol for some of the supported protocols:
    </feature-details>
    <div :class="$style.protocols">
      <DefiProtocol :image="require('~/assets/img/defi/makerdao.png')">
        <template #name>Maker DAO</template>
        Which vaults you have open, how much you have in DSR
      </DefiProtocol>
      <DefiProtocol :image="require('~/assets/img/defi/aave.png')">
        <template #name>AAVE</template>
        Your current balances and liabilities
      </DefiProtocol>
      <DefiProtocol :image="require('~/assets/img/defi/compound.png')">
        <template #name>Compound</template>
        Your current balances and liabilities
      </DefiProtocol>
      <DefiProtocol :image="require('~/assets/img/defi/yearn.png')">
        <template #name>Yearn vaults</template>
        Your current balances
      </DefiProtocol>
      <DefiProtocol :image="require('~/assets/img/defi/uniswap.png')">
        <template #name>Uniswap</template>
        Your current LP balances, and v2 trades
      </DefiProtocol>
      <DefiProtocol :image="require('~/assets/img/defi/balancer.png')">
        <template #name>Balancer</template>
        Your current LP balances, and trades
      </DefiProtocol>
    </div>
    <Caption>
      * Premium users can set watchers for various protocol so that they can be
      informed via email when certain conditions are met.
    </Caption>
  </feature>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({
  name: 'DefiDetails',
  props: {
    sticky: {
      type: Boolean,
      required: true,
    },
  },
})
</script>

<style module>
.protocols {
  @apply flex flex-row flex-wrap justify-between;
}
</style>
