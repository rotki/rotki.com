<template>
  <feature id="defi-details">
    <template #title> Ethereum DeFi protocol details </template>
    <feature-details>
      Details per protocol are supported for the following protocols:
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
        Your current LP balances
      </DefiProtocol>
      <DefiProtocol />
    </div>
    <Caption>
      * Premium users can set watchers for various protocol so that they can be
      informed via email when certain conditions are met.
    </Caption>
  </feature>
</template>

<script lang="ts">
import Vue from 'vue'

export default Vue.extend({})
</script>

<style module>
.protocols {
  @apply flex flex-row flex-wrap justify-between;
}
</style>
