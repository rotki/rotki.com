<template>
  <div :class="css.container">
    <ActionButton
      filled
      :text="t('actions.get_premium')"
      @click="navigateTo('/products')"
    />
  </div>
</template>

<script setup lang="ts">
const { t } = useI18n()
const css = useCssModule()
</script>

<style lang="scss" module>
@import '@/assets/css/media.scss';
@import '@/assets/css/main.scss';

.container {
  @apply flex flex-col align-middle self-center;

  margin-top: 105px;

  @include for-size(phone-only) {
    margin-left: auto;
    margin-right: auto;
  }

  @include for-size(tablet-landscape-up) {
    width: 42%;
  }
}
</style>
