<script setup lang="ts">
const { t } = useI18n();

const data = [
  {
    img: '/img/products/staking.webp',
    title: t('products.features.staking.title'),
    description: t('products.features.staking.description'),
  },
  {
    img: '/img/products/data_sync.webp',
    title: t('products.features.data_sync.title'),
    description: t('products.features.data_sync.description'),
  },
];
</script>

<template>
  <div class="pb-10 lg:pb-20">
    <div class="container">
      <div class="grid md:grid-cols-2 gap-12">
        <div
          v-for="item in data"
          :key="item.title"
          class="flex flex-col gap-8"
        >
          <img
            :src="item.img"
            :alt="item.title"
            class="rounded-xl w-full"
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
