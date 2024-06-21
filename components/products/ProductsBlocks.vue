<script setup lang="ts">
const { t } = useI18n();

const data = [
  {
    title: t('products.features.sync_db_with_server.title'),
    description: t('products.features.sync_db_with_server.description'),
  },
  {
    title: t('products.features.staking.title'),
    description: t('products.features.staking.description'),
  },
  {
    title: t('products.features.higher_limits.title'),
    description: t('products.features.higher_limits.description'),
  },
  {
    title: t('products.features.detailed_graphs.title'),
    description: t('products.features.detailed_graphs.description'),
  },
  {
    title: t('products.features.defi.title'),
    description: t('products.features.defi.description'),
  },
  {
    title: t('products.features.exclusive_perks.title'),
    description: t('products.features.exclusive_perks.description'),
  },
];
</script>

<template>
  <div>
    <div class="container">
      <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-x-4 gap-y-4 md:gap-y-8">
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
