<script setup lang="ts">
const { t } = useI18n({ useScope: 'global' });

const data = [
  {
    img: '/img/products/history_limits.webp',
    width: 616,
    height: 234,
    title: t('products.features.limits.history_view.title'),
    description: t('products.features.limits.history_view.description'),
  },
  {
    img: '/img/products/ethereum_validators_limits.webp',
    width: 616,
    height: 234,
    title: t('products.features.limits.validators.title'),
    description: t('products.features.limits.validators.description'),
  },
  {
    img: '/img/products/pnl_report_events_limits.webp',
    width: 616,
    height: 234,
    title: t('products.features.limits.profit_loss_report.title'),
    description: t('products.features.limits.profit_loss_report.description'),
  },
  {
    img: '/img/products/user_notes_limits.webp',
    width: 616,
    height: 234,
    title: t('products.features.limits.user_notes.title'),
    description: t('products.features.limits.user_notes.description'),
  },
];
</script>

<template>
  <div class="py-14 lg:py-28">
    <div class="container">
      <div class="flex flex-col gap-4 pb-10 lg:pb-20">
        <div class="text-rui-light-primary text-h6 font-medium">
          {{ t('products.features.limits.heading') }}
        </div>
        <h3 class="text-h5 lg:text-h3 font-bold">
          {{ t('products.features.limits.title') }}
        </h3>
      </div>
      <div class="grid md:grid-cols-2 gap-8 lg:gap-12">
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
