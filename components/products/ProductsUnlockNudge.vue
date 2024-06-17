<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
  <div class="py-14 lg:py-28 bg-rui-primary text-rui-dark-text">
    <div class="container">
      <div class="flex flex-col-reverse xl:flex-row gap-20 justify-between items-center">
        <div class="max-w-[768px] xl:w-[380px] flex flex-col gap-6">
          <h3 class="text-h4 lg:text-h3 font-bold">
            {{ t('products.unlock.title') }}
          </h3>
          <div class="text-body-1 text-rui-dark-text-secondary">
            {{ t('products.unlock.description') }}
          </div>
          <ProductsButtons class="dark" />
        </div>
        <div>
          <img
            class="max-w-[20rem] lg:max-w-full"
            src="/img/products/nudge.svg"
            :alt="t('products.unlock.title')"
          />
        </div>
      </div>
    </div>
  </div>
</template>
