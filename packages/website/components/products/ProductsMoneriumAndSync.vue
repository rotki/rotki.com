<script setup lang="ts">
const { t } = useI18n({ useScope: 'global' });

const data = [
  {
    img: '/img/products/monerium.webp',
    width: 616,
    height: 253,
    title: t('products.features.monerium_and_gnosis.monerium.title'),
    description: t('products.features.monerium_and_gnosis.monerium.description'),
  },
  {
    img: '/img/products/gnosis_pay.webp',
    width: 616,
    height: 253,
    title: t('products.features.monerium_and_gnosis.gnosis_pay.title'),
    description: t('products.features.monerium_and_gnosis.gnosis_pay.description'),
  },
];
</script>

<template>
  <div class="pb-14 lg:pb-28">
    <div class="container">
      <div class="flex flex-col gap-4 pb-10 lg:pb-20">
        <div class="text-rui-light-primary text-h6 font-medium">
          {{ t('products.features.monerium_and_gnosis.heading') }}
        </div>
        <h3 class="text-h5 lg:text-h3 font-black">
          {{ t('products.features.monerium_and_gnosis.title') }}
        </h3>
      </div>
      <div class="grid md:grid-cols-2 gap-12">
        <div
          v-for="item in data"
          :key="item.title"
          class="flex flex-col gap-8"
        >
          <NuxtImg
            :src="item.img"
            :alt="item.title"
            :width="item.width"
            :height="item.height"
            format="webp"
            loading="lazy"
            class="rounded-xl w-full border border-rui-grey-400"
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
