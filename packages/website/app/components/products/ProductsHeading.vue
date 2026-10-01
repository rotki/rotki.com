<script lang="ts" setup>
import ProductsButtons from '~/components/products/ProductsButtons.vue';

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="container">
    <div class="pt-12 pb-14 lg:pt-20 lg:pb-20 grid lg:grid-cols-[3fr_2fr] gap-10 lg:gap-16 items-center">
      <div class="flex flex-col gap-6">
        <div class="flex flex-col gap-4">
          <p class="text-rui-primary text-subtitle-1 font-medium">
            {{ t('products.heading') }}
          </p>
          <h1 class="text-h4 md:text-h3 !font-bold text-balance">
            {{ t('products.title') }}
          </h1>
          <p class="max-w-[640px] text-body-1 md:text-h6 !font-normal text-rui-text-secondary">
            {{ t('products.description') }}
          </p>
        </div>
        <ProductsButtons color="primary" />
      </div>
      <img
        class="hidden lg:block w-full max-w-[480px] mx-auto"
        src="/img/products/nudge.svg"
        alt=""
        width="600"
        height="400"
      />
    </div>
  </div>
</template>
