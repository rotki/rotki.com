<script setup lang="ts">
import { isDefined } from '@vueuse/core';
import { get } from '@vueuse/shared';
import { usePageSeo } from '~/composables/use-page-seo';

const { path } = useRoute();
const { t } = useI18n({ useScope: 'global' });
const { public: { baseUrl } } = useRuntimeConfig();

const { data: integration } = await useAsyncData(
  path,
  () => queryCollection('integrations').path(path).first(),
  { dedupe: 'defer' },
);

if (!isDefined(integration)) {
  showError({ message: `Page not found: ${path}`, status: 404 });
}
else {
  const item = get(integration);
  const title = `${item.label} integration with rotki — ${item.tagline ?? item.label}`;
  usePageSeo(title, item.intro, path, { keywords: item.keywords });

  const url = `${baseUrl}${path}`;

  const ldBlocks: string[] = [];

  ldBlocks.push(JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': baseUrl },
      { '@type': 'ListItem', 'position': 2, 'name': 'Integrations', 'item': `${baseUrl}/integrations` },
      { '@type': 'ListItem', 'position': 3, 'name': item.label, 'item': url },
    ],
  }));

  ldBlocks.push(JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': `rotki — ${item.label} integration`,
    'description': item.intro,
    'url': url,
    'applicationCategory': 'FinanceApplication',
    'operatingSystem': 'Windows, macOS, Linux',
    'offers': { '@type': 'Offer', 'price': '0', 'priceCurrency': 'USD' },
  }));

  if ((item.faq?.length ?? 0) > 0) {
    ldBlocks.push(JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': item.faq!.map(({ q, a }) => ({
        '@type': 'Question',
        'name': q,
        'acceptedAnswer': { '@type': 'Answer', 'text': a },
      })),
    }));
  }

  useHead({
    script: ldBlocks.map(innerHTML => ({ type: 'application/ld+json', innerHTML })),
  });
}

const typeLabel = computed<string>(() => {
  if (!isDefined(integration))
    return '';
  switch (get(integration).type) {
    case 'exchange': return t('integration.exchanges.title');
    case 'blockchain': return t('integration.blockchains.title');
    case 'protocol': return t('integration.protocols.title');
  }
  return '';
});

definePageMeta({
  landing: true,
});
</script>

<template>
  <div v-if="integration">
    <section class="py-10 md:py-16 bg-rui-primary/[.04]">
      <div class="container">
        <nav class="text-sm text-rui-text-secondary mb-4">
          <NuxtLink
            to="/integrations"
            class="hover:text-rui-primary"
          >
            {{ t('integration.header') }}
          </NuxtLink>
          <span class="mx-2">/</span>
          <span>{{ typeLabel }}</span>
        </nav>
        <div class="flex items-center gap-5">
          <div class="w-16 h-16 md:w-20 md:h-20 border border-rui-grey-300 rounded p-3 bg-white shrink-0">
            <img
              :src="integration.image"
              :alt="integration.label"
              class="w-full h-full object-contain"
              width="80"
              height="80"
              loading="eager"
            />
          </div>
          <div>
            <span class="text-h6 text-rui-primary">{{ typeLabel }}</span>
            <h1 class="text-h4 md:text-h3 font-bold mt-1">
              {{ integration.tagline ?? `${integration.label} integration with rotki` }}
            </h1>
          </div>
        </div>
        <p class="text-body-1 mt-6 max-w-3xl">
          {{ integration.intro }}
        </p>
      </div>
    </section>

    <section
      v-if="(integration.features?.length ?? 0) > 0"
      class="py-10 md:py-14"
    >
      <div class="container">
        <h2 class="text-h5 font-bold mb-4">
          {{ t('integration.detail.features') }}
        </h2>
        <ul class="list-disc pl-6 space-y-2 text-body-1">
          <li
            v-for="feature in integration.features"
            :key="feature"
          >
            {{ feature }}
          </li>
        </ul>
      </div>
    </section>

    <section
      v-if="(integration.limitations?.length ?? 0) > 0"
      class="py-10 md:py-14 bg-rui-primary/[.04]"
    >
      <div class="container">
        <h2 class="text-h5 font-bold mb-4">
          {{ t('integration.detail.limitations') }}
        </h2>
        <ul class="list-disc pl-6 space-y-2 text-body-1">
          <li
            v-for="limitation in integration.limitations"
            :key="limitation"
          >
            {{ limitation }}
          </li>
        </ul>
      </div>
    </section>

    <section
      v-if="(integration.setup?.length ?? 0) > 0"
      class="py-10 md:py-14"
    >
      <div class="container">
        <h2 class="text-h5 font-bold mb-4">
          {{ t('integration.detail.setup') }}
        </h2>
        <ol class="list-decimal pl-6 space-y-2 text-body-1">
          <li
            v-for="step in integration.setup"
            :key="step"
          >
            {{ step }}
          </li>
        </ol>
      </div>
    </section>

    <section
      v-if="(integration.screenshots?.length ?? 0) > 0"
      class="py-10 md:py-14 bg-rui-primary/[.04]"
    >
      <div class="container">
        <h2 class="text-h5 font-bold mb-4">
          {{ t('integration.detail.screenshots') }}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <figure
            v-for="shot in integration.screenshots"
            :key="shot.src"
          >
            <img
              :src="shot.src"
              :alt="shot.alt"
              class="rounded border border-rui-grey-300 w-full h-auto"
              loading="lazy"
            />
            <figcaption class="text-sm text-rui-text-secondary mt-2">
              {{ shot.alt }}
            </figcaption>
          </figure>
        </div>
      </div>
    </section>

    <section
      v-if="(integration.faq?.length ?? 0) > 0"
      class="py-10 md:py-14"
    >
      <div class="container">
        <h2 class="text-h5 font-bold mb-6">
          {{ t('integration.detail.faq') }}
        </h2>
        <div class="space-y-6 max-w-3xl">
          <div
            v-for="entry in integration.faq"
            :key="entry.q"
          >
            <h3 class="text-h6 font-semibold mb-2">
              {{ entry.q }}
            </h3>
            <p class="text-body-1 text-rui-text-secondary">
              {{ entry.a }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <section class="py-12 md:py-16 bg-rui-primary/[.04]">
      <div class="container flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div class="max-w-2xl">
          <h2 class="text-h5 font-bold mb-2">
            {{ t('integration.detail.cta.title', { label: integration.label }) }}
          </h2>
          <p class="text-body-1 text-rui-text-secondary">
            {{ t('integration.detail.cta.description') }}
          </p>
        </div>
        <div class="flex gap-3">
          <NuxtLink
            #default="{ navigate }"
            to="/download"
            custom
          >
            <RuiButton
              color="primary"
              tag="a"
              @click="navigate()"
            >
              {{ t('integration.detail.cta.download') }}
            </RuiButton>
          </NuxtLink>
          <NuxtLink
            #default="{ navigate }"
            to="/integrations"
            custom
          >
            <RuiButton
              variant="outlined"
              tag="a"
              @click="navigate()"
            >
              {{ t('integration.detail.cta.all') }}
            </RuiButton>
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
