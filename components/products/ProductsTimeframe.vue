<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <div class="py-14 lg:py-28">
    <div class="container">
      <div class="flex flex-col md:flex-row-reverse items-center gap-10 lg:gap-20">
        <div class="flex-1 flex justify-center">
          <img
            class="h-full w-full md:w-auto"
            src="/img/products/timeframe.webp"
            :alt="t('products.features.timeframe.title')"
          />
        </div>
        <div class="flex flex-col gap-4 flex-1">
          <div class="text-rui-light-primary text-h6 font-medium">
            {{ t('products.features.timeframe.heading') }}
          </div>
          <h3 class="text-h4 lg:text-h3 font-black">
            {{ t('products.features.timeframe.title') }}
          </h3>
          <div class="mt-2 text-body-1 text-rui-text-secondary">
            {{ t('products.features.timeframe.description') }}
          </div>
        </div>
      </div>
      <div class="flex flex-col md:flex-row items-center gap-10 lg:gap-20 mt-20">
        <div class="flex-1 flex justify-center">
          <img
            class="h-full w-full md:w-auto"
            src="/img/products/theme_customization.webp"
            :alt="t('products.features.theme_customization.title')"
          />
        </div>
        <div class="flex flex-col gap-4 flex-1">
          <h3 class="text-h4 lg:text-h3 font-black">
            {{ t('products.features.theme_customization.title') }}
          </h3>
          <div class="mt-2 text-body-1 text-rui-text-secondary">
            {{ t('products.features.theme_customization.description') }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
