<script setup lang="ts">
const { t } = useI18n({ useScope: 'global' });

const features = [
  {
    img: '/img/products/timeframe.webp',
    width: 616,
    height: 280,
    title: t('products.features.timeframe.title'),
    description: t('products.features.timeframe.description'),
  },
  {
    img: '/img/products/data_sync.webp',
    width: 616,
    height: 234,
    title: t('products.features.data_synchronization.title'),
    description: t('products.features.data_synchronization.description'),
  },
];
</script>

<template>
  <div class="py-14 lg:py-28">
    <div class="container">
      <div
        v-for="(feature, index) in features"
        :key="feature.title"
        class="flex flex-col items-center gap-10 lg:gap-20"
        :class="[
          index % 2 === 0 ? 'md:flex-row-reverse' : 'md:flex-row',
          index > 0 ? 'mt-20' : '',
        ]"
      >
        <div class="flex-1 flex justify-center">
          <NuxtImg
            class="h-full w-full md:w-auto"
            :src="feature.img"
            :alt="feature.title"
            :width="feature.width"
            :height="feature.height"
            format="webp"
            loading="lazy"
          />
        </div>
        <div class="flex flex-col gap-4 flex-1">
          <h3 class="text-h4 lg:text-h3 font-black">
            {{ feature.title }}
          </h3>
          <div class="mt-2 text-body-1 text-rui-text-secondary">
            {{ feature.description }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
