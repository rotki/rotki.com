<template>
  <feature id="defi-details">
    <template #title> {{ $t('home.eth_protocols.title') }} </template>
    <feature-details>
      {{ $t('home.eth_protocols.detail') }}
    </feature-details>
    <div :class="$style.protocols">
      <DefiProtocol :image="require('~/assets/img/defi/makerdao.png')">
        <template #name>
          {{ $t('home.eth_protocols.protocols.maker_dao.title') }}
        </template>
        {{ $t('home.eth_protocols.protocols.maker_dao.description') }}
      </DefiProtocol>
      <DefiProtocol :image="require('~/assets/img/defi/aave.png')">
        <template #name>
          {{ $t('home.eth_protocols.protocols.aave.title') }}
        </template>
        {{ $t('home.eth_protocols.protocols.aave.description') }}
      </DefiProtocol>
      <DefiProtocol :image="require('~/assets/img/defi/compound.png')">
        <template #name>
          {{ $t('home.eth_protocols.protocols.compound.title') }}
        </template>
        {{ $t('home.eth_protocols.protocols.compound.description') }}
      </DefiProtocol>
      <DefiProtocol :image="require('~/assets/img/defi/yearn.png')">
        <template #name>
          {{ $t('home.eth_protocols.protocols.yearn_vaults.title') }}
        </template>
        {{ $t('home.eth_protocols.protocols.yearn_vaults.description') }}
      </DefiProtocol>
      <DefiProtocol :image="require('~/assets/img/defi/uniswap.png')">
        <template #name>
          {{ $t('home.eth_protocols.protocols.uniswap.title') }}
        </template>
        {{ $t('home.eth_protocols.protocols.uniswap.description') }}
      </DefiProtocol>
      <DefiProtocol :image="require('~/assets/img/defi/balancer.png')">
        <template #name>
          {{ $t('home.eth_protocols.protocols.balancer.title') }}
        </template>
        {{ $t('home.eth_protocols.protocols.balancer.description') }}
      </DefiProtocol>
    </div>
    <Caption> * {{ $t('home.eth_protocols.watcher_note') }} </Caption>
  </feature>
</template>

<script lang="ts">
import { defineComponent } from '@nuxtjs/composition-api'

export default defineComponent({
  name: 'DefiDetails',
})
</script>

<style module>
.protocols {
  @apply flex flex-row flex-wrap justify-between;
}
</style>
