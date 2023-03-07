<script setup lang="ts">
const { t } = useI18n();
const css = useCssModule();
</script>

<template>
  <FeatureContainer id="defi-details">
    <template #title> {{ t('home.eth_protocols.title') }} </template>
    <FeatureDetails>
      {{ t('home.eth_protocols.detail') }}
    </FeatureDetails>
    <div :class="css.protocols">
      <DefiProtocol image="/img/defi/makerdao.png">
        <template #name>
          {{ t('home.eth_protocols.protocols.maker_dao.title') }}
        </template>
        {{ t('home.eth_protocols.protocols.maker_dao.description') }}
      </DefiProtocol>
      <DefiProtocol image="/img/defi/aave.png">
        <template #name>
          {{ t('home.eth_protocols.protocols.aave.title') }}
        </template>
        {{ t('home.eth_protocols.protocols.aave.description') }}
      </DefiProtocol>
      <DefiProtocol image="/img/defi/compound.png">
        <template #name>
          {{ t('home.eth_protocols.protocols.compound.title') }}
        </template>
        {{ t('home.eth_protocols.protocols.compound.description') }}
      </DefiProtocol>
      <DefiProtocol image="/img/defi/yearn.png">
        <template #name>
          {{ t('home.eth_protocols.protocols.yearn_vaults.title') }}
        </template>
        {{ t('home.eth_protocols.protocols.yearn_vaults.description') }}
      </DefiProtocol>
      <DefiProtocol image="/img/defi/uniswap.png">
        <template #name>
          {{ t('home.eth_protocols.protocols.uniswap.title') }}
        </template>
        {{ t('home.eth_protocols.protocols.uniswap.description') }}
      </DefiProtocol>
      <DefiProtocol image="/img/defi/balancer.png">
        <template #name>
          {{ t('home.eth_protocols.protocols.balancer.title') }}
        </template>
        {{ t('home.eth_protocols.protocols.balancer.description') }}
      </DefiProtocol>
    </div>
    <CaptionText> * {{ t('home.eth_protocols.watcher_note') }} </CaptionText>
  </FeatureContainer>
</template>

<style module>
.protocols {
  @apply flex flex-row flex-wrap justify-between;
}
</style>
