<script lang="ts" setup>
import AppShowcaseSlider from '~/components/common/AppShowcaseSlider.vue';

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <section class="pt-14 lg:pt-20">
    <div class="container flex flex-col items-center text-center gap-3 mb-8 lg:mb-10">
      <h2 class="text-h4 !font-bold">
        {{ t('download.preview.title') }}
      </h2>
      <p class="text-body-1 text-rui-text-secondary max-w-[560px]">
        {{ t('download.preview.detail') }}
      </p>
    </div>
    <AppShowcaseSlider hide-thumbnail />
  </section>
</template>
