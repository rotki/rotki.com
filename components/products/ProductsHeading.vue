<script lang="ts" setup>
const { t } = useI18n();
</script>

<template>
  <div class="py-10 lg:py-20">
    <div class="container">
      <div class="flex flex-col gap-12">
        <div class="flex flex-col gap-6">
          <div class="text-rui-light-primary text-h6 font-medium">
            {{ t('products.heading') }}
          </div>
          <h2 class="text-h4 lg:text-h2 !font-bold">
            {{ t('products.title') }}
          </h2>
          <div class="max-w-[768px] text-body-1 text-rui-text-secondary">
            {{ t('products.description') }}
          </div>
        </div>
        <ProductsButtons color="primary" />
      </div>
    </div>
  </div>
</template>
