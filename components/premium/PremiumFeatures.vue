<script setup lang="ts">
const { t } = useI18n();
const css = useCssModule();
</script>

<template>
  <div id="premium" :class="css.premium">
    <div :class="css.image">
      <img :class="css.top" alt="rotki og" src="/img/rotki-og.svg" />
    </div>
    <div :class="css.wrapper">
      <div>
        <div :class="css.title">{{ t('home.premium_features.title') }}</div>
      </div>
      <div :class="css.main">
        <div :class="css.content">
          <GraphsStatistics />
          <TransactionHistory />
          <PremiumDefi />
          <DexSupport />
          <PremiumStaking />
          <GetPremium />
        </div>
      </div>
    </div>
    <div :class="css.image">
      <img :class="css.bottom" alt="rotki og" src="/img/rotki-og.svg" />
    </div>
  </div>
</template>

<style lang="scss" module>
@import '@/assets/css/main.scss';
@import '@/assets/css/media.scss';

.premium {
  padding-top: 350px;
  padding-bottom: 70px;
  width: 100%;
  overflow-x: hidden;

  @include for-size(phone-only) {
    padding-top: 200px;
    overflow-y: hidden;
  }
}

.wrapper {
  @apply bg-rui-primary-darker;

  padding-bottom: 100px;

  @include for-size(phone-only) {
    padding-bottom: 400px;
  }
}

.main {
  @apply container;
}

.title {
  @apply text-rui-primary-lighter font-bold;

  padding-top: 91px;
  margin-bottom: 10px;
  align-items: center;
  text-align: center;
  letter-spacing: -0.03em;

  @include text-size(66px, 76px);
}

.content {
  @apply flex-wrap flex-row flex justify-between;

  margin-left: $mobile-margin;
  margin-right: $mobile-margin * 2;

  > * {
    @include for-size(tablet-landscape-up) {
      width: 50%;
    }
  }

  @include for-size(tablet-portrait-up) {
    @apply justify-evenly;
  }

  @include for-size(big-desktop-up) {
    @apply justify-between;
  }
}

.image {
  position: relative;
  width: 100%;
}

.top {
  position: absolute;
  top: -317px;
  left: -50px;
  width: 358px;
  height: 347px;

  @include for-size(phone-only) {
    position: relative;
    top: 31px;
  }
}

.bottom {
  position: absolute;
  right: -200px;
  transform: matrix(-1, 0, 0, 1, 0, 0);
  width: 358px;
  height: 347px;

  @include for-size(phone-only) {
    bottom: -55px;
  }

  @include for-size(tablet-portrait-up) {
    bottom: -56px;
  }
}
</style>
