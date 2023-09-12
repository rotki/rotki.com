<script lang="ts" setup>
const { t } = useI18n();
</script>

<template>
  <div class="py-10 md:py-20">
    <div class="container">
      <div class="text-h6 text-rui-primary">
        {{ t('values.title') }}
      </div>
      <div class="text-h5 md:text-h3 mt-4">
        {{ t('values.subtitle') }}
      </div>
    </div>
  </div>
</template>
