<script setup lang="ts">
const emit = defineEmits<{ (e: 'download'): void }>();

const css = useCssModule();
</script>

<template>
  <NavigationAnchor id="features" />
  <MiddleMenu />
  <div :class="css.wrapper">
    <div>
      <AppDashboard @download="emit('download')" />
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
    margin-left: 280px !important;
    margin-bottom: -150px;
  }

  @include for-size(desktop-up) {
    margin-left: 280px;
    margin-bottom: -150px;
  }
}
</style>
