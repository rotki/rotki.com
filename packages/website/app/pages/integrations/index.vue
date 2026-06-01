<script setup lang="ts">
import { get } from '@vueuse/shared';
import IntegrationDetails from '~/components/integration/IntegrationDetails.vue';
import { useIntegrationsData } from '~/composables/use-integrations-data';
import { usePageSeo } from '~/composables/use-page-seo';

const { t } = useI18n({ useScope: 'global' });

usePageSeo(
  'Integrations',
  'Explore the blockchains, exchanges, and DeFi protocols supported by rotki for seamless crypto portfolio tracking.',
  '/integrations',
);

const { public: { baseUrl } } = useRuntimeConfig();
const { data: integrationData, filterDuplicateData } = useIntegrationsData();

const integrationJsonLd = computed<string>(() => {
  const data = filterDuplicateData({ ...get(integrationData) });
  const allItems = [...data.blockchains, ...data.exchanges, ...data.protocols];
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': 'rotki Integrations',
    'description': 'Blockchains, exchanges, and DeFi protocols supported by rotki.',
    'url': `${baseUrl}/integrations`,
    'numberOfItems': allItems.length,
    'itemListElement': allItems.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.label,
    })),
  });
});

useHead({
  script: [{ type: 'application/ld+json', innerHTML: integrationJsonLd }],
});

definePageMeta({
  landing: true,
});
</script>

<template>
  <div class="py-10 md:py-20 bg-rui-primary/[.04]">
    <div class="container flex flex-col lg:flex-row justify-between gap-y-10 gap-x-20">
      <div class="max-w-[608px]">
        <span class="text-h6 text-rui-primary">
          {{ t('integration.header') }}
        </span>
        <h1 class="text-h4 md:text-h3 font-bold mt-3">
          {{ t('integration.title') }}
        </h1>
        <p class="text-body-1 mt-4">
          {{ t('integration.description') }}
        </p>
      </div>
      <div class="flex justify-center lg:justify-end">
        <img
          class="max-w-[384px] overflow-hidden h-full object-contain"
          :alt="t('home.exchanges.title')"
          src="/img/exchanges.png"
          loading="lazy"
          width="384"
          height="207"
        />
      </div>
    </div>
  </div>
  <IntegrationDetails />
</template>
