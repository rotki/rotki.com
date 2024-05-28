<script setup lang="ts">
import type { RuiIcons } from '@rotki/ui-library';

const { t } = useI18n();

const data: { icon: RuiIcons; title: string; description: string }[] = [
  {
    icon: 'database-2-line',
    title: t('products.features.data_synchronization.title'),
    description: t('products.features.data_synchronization.description'),
  },
  {
    icon: 'moon-line',
    title: t('products.features.dark_mode.title'),
    description: t('products.features.dark_mode.description'),
  },
  {
    icon: 'key-2-line',
    title: t('products.features.monerium_api_keys.title'),
    description: t('products.features.monerium_api_keys.description'),
  },
  {
    icon: 'palette-line',
    title: t('products.features.theme_customization.title'),
    description: t('products.features.theme_customization.description'),
  },
];
</script>

<template>
  <div class="py-16 lg:py-32 bg-rui-primary text-rui-dark-text">
    <div class="container">
      <div class="flex flex-col xl:flex-row gap-20">
        <div class="max-w-[768px] xl:w-[380px] flex flex-col gap-6">
          <h3 class="text-h4 lg:text-h3 font-bold">
            {{ t('products.unlock.title') }}
          </h3>
          <div class="text-body-1 text-rui-dark-text-secondary">
            {{ t('products.unlock.description') }}
          </div>
          <ProductsButtons class="dark" />
        </div>
        <div class="flex-1 grid md:grid-cols-2 gap-x-12 gap-y-16">
          <div
            v-for="item in data"
            :key="item.title"
            class="flex flex-col gap-4 md:gap-6 items-start"
          >
            <div class="bg-white rounded-lg p-2 text-rui-text">
              <RuiIcon
                :name="item.icon"
                size="16"
              />
            </div>
            <h4 class="text-h5 xl:text-h4 font-bold">
              {{ item.title }}
            </h4>
            <div class="text-body-1 text-rui-dark-text-secondary">
              {{ item.description }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
