<script setup lang="ts">
const defi = [
  'MakerDAO',
  'Aave',
  'Compound',
  'Yearn vaults',
  'Uniswap',
  'Balancer',
  'and many more...',
];

const { t } = useI18n();
const css = useCssModule();
</script>

<template>
  <FeatureContainer id="defi">
    <template #title> {{ t('home.defi.title') }} </template>
    <template #image>
      <img :class="css.image" alt="DeFi protocols" src="/img/defi.png" />
    </template>
    <FeatureDetails>
      {{ t('home.defi.detail') }}
    </FeatureDetails>
    <div :class="css['list-container']">
      <ItemList :list="defi" />
    </div>
    <ButtonLink :class="css.link" to="/supported#defi">
      {{ t('home.more_information') }}
    </ButtonLink>
  </FeatureContainer>
</template>

<style lang="scss" module>
@import '@/assets/css/media.scss';
@import '@/assets/css/main.scss';

.image {
  z-index: -1;
  @include for-size(phone-only) {
    width: 100%;
    position: relative;
    right: 0;
  }

  @include for-size(tablet-portrait-up) {
    position: relative;
    margin-bottom: 60px;
  }

  @include for-size(tablet-landscape-up) {
    max-width: 732px;
  }

  @include for-size(desktop-up) {
    position: absolute;
    margin-top: 38px;
    right: -200px;
  }
}

.link {
  @apply mt-6 text-2xl;
}
</style>
