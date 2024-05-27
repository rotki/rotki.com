<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <div class="py-16 lg:py-32">
    <div class="container">
      <div class="flex flex-col md:flex-row items-center gap-10">
        <div class="flex flex-col gap-4">
          <div class="text-rui-light-primary text-h6 font-medium">
            {{ t('products.details') }}
          </div>
          <h3 class="text-h4 lg:text-h3 font-black">
            {{ t('products.features.timeframe.title') }}
          </h3>
          <div class="mt-2 text-body-1 text-rui-text-secondary">
            {{ t('products.features.timeframe.description') }}
          </div>
        </div>
        <div>
          <img
            class="min-w-[300px] w-[450px] md:w-auto"
            src="/img/products/timeframe.webp"
            :alt="t('products.features.timeframe.title')"
          />
        </div>
      </div>
    </div>
  </div>
</template>
