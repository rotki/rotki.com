<script setup lang="ts">
const { t } = useI18n();

const data = [
  {
    img: '/img/products/stats_asset_amount_value.webp',
    title: t('products.features.analytics.asset_amount_and_value.title'),
    description: t('products.features.analytics.asset_amount_and_value.description'),
  },
  {
    img: '/img/products/stats_distribution_location.webp',
    title: t('products.features.analytics.distribution_locations.title'),
    description: t('products.features.analytics.distribution_locations.description'),
  },
];
</script>

<template>
  <div class="py-14 lg:py-28 bg-rui-grey-50">
    <div class="container">
      <div class="flex flex-col gap-4 pb-10 lg:pb-20">
        <div class="text-rui-light-primary text-h6 font-medium">
          {{ t('products.features.analytics.heading') }}
        </div>
        <h3 class="text-h5 lg:text-h3 font-black">
          {{ t('products.features.analytics.title') }}
        </h3>
      </div>
      <div class="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div
          v-for="item in data"
          :key="item.title"
          class="flex flex-col gap-8"
        >
          <img
            :src="item.img"
            :alt="item.title"
            class="rounded-xl border border-rui-grey-400"
          />
          <div class="flex flex-col gap-6">
            <h4 class="text-h5 xl:text-h4 font-bold">
              {{ item.title }}
            </h4>
            <div class="text-body-1 text-rui-text-secondary">
              {{ item.description }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
