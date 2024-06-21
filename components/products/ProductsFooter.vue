<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <div class="container">
    <div class="bg-rui-primary/[0.08] rounded-xl flex flex-col gap-6 lg:gap-10 lg:flex-row p-6 lg:p-10 justify-between items-start">
      <div class="text-[#475467] text-body-1 md:text-h6 font-medium max-w-[768px] lg:flex-1">
        {{ t('products.footer.description') }}
      </div>
      <ProductsButtons color="primary" />
    </div>
  </div>
</template>
