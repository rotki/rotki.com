<script setup lang="ts">
const { t } = useI18n();

const data = [
  {
    title: t('products.features.staking.title'),
    description: t('products.features.staking.description'),
  },
  {
    title: t('products.features.higher_limits.title'),
    description: t('products.features.higher_limits.description'),
  },
  {
    title: t('products.features.a_lot_of_perks.title'),
    description: t('products.features.a_lot_of_perks.description'),
  },
  {
    title: t('products.features.graphs.title'),
    description: t('products.features.graphs.description'),
  },
  {
    title: t('products.features.synchronization.title'),
    description: t('products.features.synchronization.description'),
  },
  {
    title: t('products.features.defi_protocol.title'),
    description: t('products.features.defi_protocol.description'),
  },
];
</script>

<template>
  <div class="py-10 lg:py-20">
    <div class="container">
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-4 md:gap-y-8">
        <div
          v-for="item in data"
          :key="item.title"
          class="rounded-xl bg-rui-primary/[0.08] px-4 pt-6 pb-8 md:px-6 md:pt-8 md:pb-14 flex flex-col gap-4"
        >
          <h6 class="text-h6">
            {{ item.title }}
          </h6>
          <div class="text-rui-text-secondary text-body-1">
            {{ item.description }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
