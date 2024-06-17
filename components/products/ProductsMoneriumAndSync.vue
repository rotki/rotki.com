<script setup lang="ts">
const { t } = useI18n();

const data = [
  {
    img: '/img/products/monerium.webp',
    title: t('products.features.monerium_and_backup.monerium_api_keys.title'),
    description: t('products.features.monerium_and_backup.monerium_api_keys.description'),
  },
  {
    img: '/img/products/data_sync.webp',
    title: t('products.features.monerium_and_backup.data_synchronization.title'),
    description: t('products.features.monerium_and_backup.data_synchronization.description'),
  },
];
</script>

<template>
  <div class="pb-14 lg:pb-28">
    <div class="container">
      <div class="flex flex-col gap-4 pb-10 lg:pb-20">
        <div class="text-rui-light-primary text-h6 font-medium">
          {{ t('products.features.monerium_and_backup.heading') }}
        </div>
        <h3 class="text-h5 lg:text-h3 font-black">
          {{ t('products.features.monerium_and_backup.title') }}
        </h3>
      </div>
      <div class="grid md:grid-cols-2 gap-12">
        <div
          v-for="item in data"
          :key="item.title"
          class="flex flex-col gap-8"
        >
          <img
            :src="item.img"
            :alt="item.title"
            class="rounded-xl w-full border border border-rui-grey-400"
          />

          <div class="flex flex-col gap-6">
            <h4 class="text-h5 xl:text-h4 font-bold">
              {{ item.title }}
            </h4>
            <div class="text-rui-text-secondary text-body-1">
              {{ item.description }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
