<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <div class="container">
    <div class="bg-rui-primary/[0.08] rounded-xl flex flex-col gap-6 lg:gap-10 lg:flex-row p-6 lg:p-10 justify-between items-start">
      <div class="flex flex-col gap-2 lg:gap-4 flex-1">
        <h4 class="text-h5 lg:text-h4 font-bold">
          {{ t('products.footer.title') }}
        </h4>
        <div class="text-body-1 text-rui-text-secondary">
          {{ t('products.footer.description') }}
        </div>
      </div>
      <ProductsButtons color="primary" />
    </div>
  </div>
</template>
