<script setup lang="ts">
import ButtonLink from '~/components/common/ButtonLink.vue';
import ProductsButtons from '~/components/products/ProductsButtons.vue';

const { t } = useI18n({ useScope: 'global' });
</script>

<template>
  <div class="container">
    <div class="bg-rui-primary/[0.08] rounded-xl flex flex-col gap-6 lg:gap-10 lg:flex-row p-6 lg:p-10 justify-between items-start">
      <div class="flex flex-col gap-3 max-w-[768px] lg:flex-1">
        <div class="text-[#475467] text-body-1 md:text-h6 font-medium">
          {{ t('products.footer.description') }}
        </div>
        <div class="text-[#475467] text-body-2">
          <i18n-t
            keypath="products.footer.integrations"
            scope="global"
          >
            <template #integrations>
              <ButtonLink
                to="/integrations"
                inline
                color="primary"
              >
                {{ t('products.footer.integrations_link') }}
              </ButtonLink>
            </template>
          </i18n-t>
        </div>
      </div>
      <ProductsButtons color="primary" />
    </div>
  </div>
</template>
