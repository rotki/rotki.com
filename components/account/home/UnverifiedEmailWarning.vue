<script setup lang="ts">
const color = '#ed6c02';
const { t } = useI18n();
const css = useCssModule();
</script>

<template>
  <div role="alert" :class="css.alert">
    <AlertIcon :color="color" width="17px" :class="css.icon" />
    {{ t('account.unverified_email.message') }}
  </div>
</template>

<style module lang="scss">
.alert {
  @apply py-1.5 px-4 mb-4 mt-4 text-sm rounded flex flex-row font-sans;

  background: linear-gradient(
      0deg,
      rgba(255, 255, 255, 0.9),
      rgba(255, 255, 255, 0.9)
    ),
    v-bind(color);
}

.icon {
  @apply mr-2;
}
</style>
