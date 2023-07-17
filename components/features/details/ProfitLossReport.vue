<script setup lang="ts">
const { t } = useI18n();
const css = useCssModule();
</script>

<template>
  <FeatureContainer id="profitloss-report">
    <template #title> {{ t('home.profit_loss_report.title') }}</template>
    <template #image>
      <img :class="css.image" alt="Cryptocurrencies" src="/img/crypto.svg" />
    </template>
    <FeatureDetails>
      <I18nT keypath="home.profit_loss_report.detail" scope="global">
        <br />
      </I18nT>
    </FeatureDetails>
  </FeatureContainer>
</template>

<style lang="scss" module>
@import '@/assets/css/media.scss';
@import '@/assets/css/main.scss';

.image {
  z-index: -1;

  @include for-size(phone-only) {
    position: relative;
    right: 0;
  }

  @include for-size(tablet-portait-up) {
    position: relative;
  }

  @include for-size(desktop-up) {
    position: absolute;
    margin-top: 40px;
    right: -80px;
  }
}
</style>
