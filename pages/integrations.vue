<script setup lang="ts">
import { commonAttrs, getMetadata } from '~/utils/metadata';

const { t } = useI18n();

const title = 'integrations';
const description = 'Supported blockchains, exchanges, and protocols in rotki';

const {
  public: { baseUrl },
} = useRuntimeConfig();

useHead({
  title,
  meta: getMetadata(title, description, `${baseUrl}/integrations/`, baseUrl),
  ...commonAttrs(),
});

definePageMeta({
  layout: 'landing',
});
</script>

<template>
  <div class="py-10 md:py-20 bg-rui-primary/[.04]">
    <div class="container flex flex-col lg:flex-row justify-between gap-y-10 gap-x-20">
      <div class="max-w-[608px]">
        <h6 class="text-h6 text-rui-primary">
          {{ t('integration.header') }}
        </h6>
        <h3 class="text-h4 md:text-h3 font-black mt-3">
          {{ t('integration.title') }}
        </h3>
        <div class="text-body-1 mt-4">
          {{ t('integration.description') }}
        </div>
      </div>
      <div class="flex justify-center lg:justify-end">
        <img
          class="max-w-[384px] overflow-hidden h-full object-contain"
          :alt="t('home.exchanges.title')"
          src="/img/exchanges.png"
        />
      </div>
    </div>
  </div>
  <IntegrationDetails />
</template>
