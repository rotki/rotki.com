<script setup lang="ts">
const css = useCssModule();
</script>

<template>
  <NavigationAnchor id="features" />
  <MiddleMenu />
  <div :class="css.wrapper">
    <div>
      <AppDashboard />
      <SupportedExchangeDetails />
      <DefiProtocols />
      <DefiDetails />
      <ProfitLossReport :class="css.last" />
    </div>
  </div>
</template>

<style lang="scss" module>
@import '@/assets/css/media.scss';
@import '@/assets/css/main.scss';

.wrapper {
  @apply container;
}

.last {
  @include for-size(phone-only) {
    margin-left: 0;
  }

  @include for-size(tablet-portrait-up) {
    margin-left: 0;
  }

  @include for-size(tablet-landscape-up) {
    margin-left: 17.5rem !important;
  }

  @include for-size(desktop-up) {
    margin-left: 17.5rem;
  }
}
</style>
