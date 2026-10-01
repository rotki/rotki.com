<script setup lang="ts">
const { t } = useI18n({ useScope: 'global' });

// Intrinsic sizes of the 1.44 captures; they differ in shape, so the template frames them.
const data = [
  {
    img: '/img/products/stats_asset_amount_value.webp',
    width: 2250,
    height: 1160,
    title: t('products.features.analytics.asset_amount_and_value.title'),
    description: t('products.features.analytics.asset_amount_and_value.description'),
  },
  {
    img: '/img/products/stats_distribution_asset.webp',
    width: 1132,
    height: 1378,
    title: t('products.features.analytics.distribution_assets.title'),
    description: t('products.features.analytics.distribution_assets.description'),
  },
  {
    img: '/img/products/stats_distribution_location.webp',
    width: 1136,
    height: 1378,
    title: t('products.features.analytics.distribution_locations.title'),
    description: t('products.features.analytics.distribution_locations.description'),
  },
  {
    img: '/img/products/stats_events_analysis.webp',
    width: 1892,
    height: 1700,
    title: t('products.features.analytics.events_analysis.title'),
    description: t('products.features.analytics.events_analysis.description'),
  },
];
</script>

<template>
  <div class="py-14 lg:py-20 bg-rui-grey-50">
    <div class="container">
      <div class="flex flex-col gap-3 pb-8 lg:pb-12">
        <p class="text-rui-primary text-subtitle-1 font-medium">
          {{ t('products.features.analytics.heading') }}
        </p>
        <h2 class="text-h5 lg:text-h4 !font-bold">
          {{ t('products.features.analytics.title') }}
        </h2>
      </div>
      <div class="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div
          v-for="item in data"
          :key="item.title"
          class="flex flex-col gap-6"
        >
          <div class="aspect-[4/3] flex items-center justify-center rounded-xl border border-rui-grey-300 bg-white overflow-hidden p-3">
            <img
              :src="item.img"
              :alt="item.title"
              :width="item.width"
              :height="item.height"
              loading="lazy"
              class="max-h-full w-auto object-contain"
            />
          </div>
          <div class="flex flex-col gap-3">
            <h3 class="text-h6 xl:text-h5 font-bold">
              {{ item.title }}
            </h3>
            <div class="text-body-1 text-rui-text-secondary">
              {{ item.description }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
