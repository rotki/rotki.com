<script setup lang="ts">
const { t } = useI18n();

const data = [
  {
    img: '/img/products/transactions.webp',
    title: t('products.features.limits.transactions.title'),
    description: t('products.features.limits.transactions.description'),
  },
  {
    img: '/img/products/trades.webp',
    title: t('products.features.limits.trades.title'),
    description: t('products.features.limits.trades.description'),
  },
  {
    img: '/img/products/deposits_and_withdrawals.webp',
    title: t('products.features.limits.deposits_and_withdrawals.title'),
    description: t('products.features.limits.deposits_and_withdrawals.description'),
  },
];
</script>

<template>
  <div class="py-16 lg:py-32">
    <div class="container">
      <div class="flex flex-col gap-4 pb-10 lg:pb-20">
        <div class="text-rui-light-primary text-h6 font-medium">
          {{ t('products.details') }}
        </div>
        <h3 class="text-h5 lg:text-h3 font-black">
          {{ t('products.features.limits.title') }}
        </h3>
      </div>
      <div class="grid md:grid-cols-3 gap-8 lg:gap-12">
        <div
          v-for="item in data"
          :key="item.title"
          class="flex flex-col gap-8"
        >
          <img
            :src="item.img"
            :alt="item.title"
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
