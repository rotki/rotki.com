<script setup lang="ts">
import { get } from '@vueuse/shared';
import { usePlanLimits } from '~/composables/tiers/use-plan-limits';

const { t } = useI18n({ useScope: 'global' });

const limits = usePlanLimits();

const features = computed<{ img: string; width: number; height: number; title: string; description: string }[]>(() => [
  {
    img: '/img/products/timeframe.webp',
    width: 2252,
    height: 800,
    title: t('products.features.timeframe.title'),
    description: t('products.features.timeframe.description'),
  },
  {
    img: '/img/products/data_sync.webp',
    width: 640,
    height: 288,
    title: t('products.features.data_synchronization.title'),
    description: t('products.features.data_synchronization.description', {
      basicBackup: get(limits).basic.backup,
      basicDevices: get(limits).basic.devices,
      advancedBackup: get(limits).advanced.backup,
      advancedDevices: get(limits).advanced.devices,
    }),
  },
  {
    // Staged capture: fictional counterparties and the documentation example IBAN, see the screenshot kit manifest
    img: '/img/products/monerium.webp',
    width: 2400,
    height: 1088,
    title: t('products.features.monerium.title'),
    description: t('products.features.monerium.description'),
  },
]);
</script>

<template>
  <div class="py-14 lg:py-20 bg-rui-grey-50">
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
          <img
            class="h-auto w-full md:w-auto max-w-full rounded-xl border border-rui-grey-200 shadow-sm"
            :src="feature.img"
            :alt="feature.title"
            :width="feature.width"
            :height="feature.height"
            loading="lazy"
          />
        </div>
        <div class="flex flex-col gap-4 flex-1">
          <h2 class="text-h5 lg:text-h4 font-bold">
            {{ feature.title }}
          </h2>
          <div class="mt-2 text-body-1 text-rui-text-secondary">
            {{ feature.description }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
