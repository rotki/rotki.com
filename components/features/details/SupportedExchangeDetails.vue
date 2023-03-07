<script setup lang="ts">
const column1 = ['Kraken', 'KuCoin', 'Binance', 'Binance US', 'Bittrex'];
const column2 = ['Coinbase', 'Coinbase Pro', 'Gemini', 'and many more...'];
const css = useCssModule();
const { t } = useI18n();
</script>

<template>
  <FeatureContainer id="exchanges">
    <template #title>
      {{ t('home.exchanges.title') }}
    </template>
    <template #image>
      <img
        :class="css.image"
        alt="Supported Exchanges"
        src="/img/exchanges.png"
      />
    </template>
    <FeatureDetails>
      {{ t('home.exchanges.detail') }}
    </FeatureDetails>
    <div :class="css.list">
      <ItemList :list="column1" />
      <ItemList :list="column2" />
    </div>
    <ExternalLink
      :class="css.link"
      same-tab
      :text="t('home.more_information')"
      url="/supported"
    />
  </FeatureContainer>
</template>

<style lang="scss" module>
@import '@/assets/css/media.scss';
@import '@/assets/css/main.scss';

.image {
  z-index: -1;
  position: absolute;

  @include for-size(phone-only) {
    max-width: 100%;
    position: relative;
    right: 0;
  }

  @include for-size(tablet-portrait-up) {
    position: relative;
    max-width: 100%;
    top: 0;
  }

  @include for-size(tablet-landscape-up) {
    margin-top: 20px;
    max-width: 755px;
  }

  @include for-size(desktop-up) {
    position: absolute;
    right: -250px;
  }
}

.list {
  @apply flex flex-row justify-between;

  padding-right: 120px;

  @include for-size(phone-only) {
    padding-right: 40px;
  }
}

.link {
  @apply mt-6 text-2xl;
}
</style>
