<script setup lang="ts">
import { isDefined } from '@vueuse/core';
import { get } from '@vueuse/shared';
import ButtonLink from '~/components/common/ButtonLink.vue';
import { usePageSeo } from '~/composables/use-page-seo';
import { INTEGRATION_QUALIFIERS } from '~/utils/integration-slug';

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
  const slug = path.replace(/\/+$/, '').split('/').pop() ?? '';
  // Keep the SERP title short (<60 chars); titleTemplate appends " | rotki".
  // The full descriptive tagline still lives in the visible <h1>/intro; the meta
  // description uses the shorter `metaDescription` field to stay under 160 chars.
  const title = `${item.label} support`;
  // OG image is generated per-slug at build time by the integration-seo module
  // (with a share.png fallback written to the same path), so this URL always resolves.
  usePageSeo(title, item.metaDescription, path, { keywords: item.keywords, ogImage: `integrations/${slug}.png` });

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
    'name': `rotki - ${item.label} integration`,
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
    // Escape the angle bracket so a closing-script sequence inside the JSON-LD
    // (e.g. from FAQ content) cannot break out of the server-rendered script tag.
    script: ldBlocks.map(block => ({
      type: 'application/ld+json',
      innerHTML: block.replaceAll('<', '\\u003c'),
    })),
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

const qualifierBadge = computed<string | undefined>(() => {
  if (!isDefined(integration))
    return undefined;
  return INTEGRATION_QUALIFIERS[get(integration).slug];
});

const tierBadge = computed<string | undefined>(() => {
  if (!isDefined(integration))
    return undefined;
  switch (get(integration).ctaPlan) {
    case 'basic': return t('integration.detail.tier.basic');
    case 'advanced': return t('integration.detail.tier.advanced');
  }
  return undefined;
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
        <div class="flex items-start gap-5">
          <div class="w-16 h-16 md:w-20 md:h-20 border border-rui-grey-200 rounded-xl p-3 bg-white shadow-sm shrink-0">
            <img
              :src="integration.image"
              :alt="integration.label"
              class="w-full h-full object-contain"
              width="80"
              height="80"
              loading="eager"
            />
          </div>
          <div class="flex flex-col gap-2">
            <div class="flex flex-wrap items-center gap-2">
              <RuiChip
                size="sm"
                color="primary"
                variant="outlined"
              >
                {{ typeLabel }}
              </RuiChip>
              <RuiChip
                v-if="qualifierBadge"
                size="sm"
                variant="outlined"
              >
                {{ qualifierBadge }}
              </RuiChip>
              <RuiChip
                v-if="tierBadge"
                size="sm"
                color="warning"
              >
                {{ tierBadge }}
              </RuiChip>
            </div>
            <h1 class="text-h4 md:text-h3 font-bold">
              {{ integration.tagline ?? `${integration.label} integration with rotki` }}
            </h1>
          </div>
        </div>
        <p class="text-body-1 text-rui-text-secondary mt-6 max-w-3xl">
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
        <ul class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          <li
            v-for="feature in integration.features"
            :key="feature"
            class="flex items-start gap-3 text-body-1"
          >
            <RuiIcon
              name="lu-circle-check"
              size="20"
              color="primary"
              class="shrink-0 mt-0.5"
            />
            <span>{{ feature }}</span>
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
        <ul class="space-y-3 max-w-3xl">
          <li
            v-for="limitation in integration.limitations"
            :key="limitation"
            class="flex items-start gap-3 text-body-1"
          >
            <RuiIcon
              name="lu-circle-alert"
              size="20"
              color="warning"
              class="shrink-0 mt-0.5"
            />
            <span>{{ limitation }}</span>
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
        <ol class="space-y-4 max-w-3xl">
          <li
            v-for="(step, index) in integration.setup"
            :key="step"
            class="flex items-start gap-4 text-body-1"
          >
            <span class="flex items-center justify-center w-8 h-8 rounded-full bg-rui-primary/10 text-rui-primary font-bold text-sm shrink-0">
              {{ index + 1 }}
            </span>
            <span class="pt-1">{{ step }}</span>
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
        <div class="space-y-4 max-w-3xl">
          <div
            v-for="entry in integration.faq"
            :key="entry.q"
            class="flex items-start gap-4 border border-rui-grey-200 rounded-xl p-5 bg-white"
          >
            <div class="flex items-center justify-center w-9 h-9 rounded-full bg-rui-primary/10 shrink-0">
              <RuiIcon
                name="lu-message-circle"
                size="20"
                color="primary"
              />
            </div>
            <div>
              <h3 class="text-h6 font-semibold mb-1">
                {{ entry.q }}
              </h3>
              <p class="text-body-1 text-rui-text-secondary">
                {{ entry.a }}
              </p>
            </div>
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
          <ButtonLink
            to="/download"
            color="primary"
            variant="default"
          >
            {{ t('integration.detail.cta.download') }}
          </ButtonLink>
          <ButtonLink
            to="/integrations"
            variant="outlined"
          >
            {{ t('integration.detail.cta.all') }}
          </ButtonLink>
        </div>
      </div>
    </section>
  </div>
</template>
