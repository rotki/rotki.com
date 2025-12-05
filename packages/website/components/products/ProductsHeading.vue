<script lang="ts" setup>
import ProductsButtons from '~/components/products/ProductsButtons.vue';

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="container">
    <div class="py-10 lg:py-20 flex flex-col gap-12">
      <div class="flex flex-col gap-4">
        <div class="text-rui-light-primary text-h6 font-medium">
          {{ t('products.heading') }}
        </div>
        <h4 class="text-h4 !font-bold">
          {{ t('products.title') }}
        </h4>
        <div class="max-w-[768px] text-body-1 text-rui-text-secondary">
          {{ t('products.description') }}
        </div>
      </div>
      <ProductsButtons color="primary" />
    </div>
  </div>
</template>
