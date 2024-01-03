<script lang="ts" setup>
import AppShowcaseSlider from '~/components/common/AppShowcaseSlider.vue';

const { t } = useI18n();
</script>

<template>
  <div class="py-10 lg:py-20 md:mb-12">
    <AppShowcaseSlider>
      <div class="text-h5 md:text-h4 font-medium">
        {{ t('download.preview') }}
      </div>
    </AppShowcaseSlider>
  </div>
</template>
