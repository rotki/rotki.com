<script setup lang="ts">
import type { FeatureHubCollectionItem, FeaturesCollectionItem } from '@nuxt/content';
import { get } from '@vueuse/shared';
import { usePageSeo } from '~/composables/use-page-seo';

const { t } = useI18n({ useScope: 'global' });
const { public: { baseUrl } } = useRuntimeConfig();

usePageSeo(
  t('features.title'),
  t('features.description'),
  '/features',
);

const { data: hub } = await useAsyncData(
  'feature-hub',
  () => queryCollection('featureHub').first(),
  { dedupe: 'defer' },
);

const { data: features } = await useAsyncData(
  'features-hub',
  () => queryCollection('features').order('label', 'ASC').all(),
  { dedupe: 'defer' },
);

const items = computed<FeaturesCollectionItem[]>(() => get(features) ?? []);
const hubData = computed<FeatureHubCollectionItem | undefined>(() => get(hub) ?? undefined);
const keyTakeaways = computed<string[]>(() => get(hubData)?.keyTakeaways ?? []);
const rotkiHighlights = computed<string[]>(() => get(hubData)?.rotkiHighlights ?? []);
const faq = computed<{ q: string; a: string }[]>(() => get(hubData)?.faq ?? []);

const jsonLd = computed<string[]>(() => {
  const list = get(items);
  const blocks: string[] = [];

  blocks.push(JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': 'rotki feature guides',
    'description': t('features.description'),
    'url': `${baseUrl}/features`,
    'numberOfItems': list.length,
    'itemListElement': list.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.label,
      'item': `${baseUrl}${item.path}`,
    })),
  }));

  const faqItems = get(faq);
  if (faqItems.length > 0) {
    blocks.push(JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': faqItems.map(({ q, a }) => ({
        '@type': 'Question',
        'name': q,
        'acceptedAnswer': { '@type': 'Answer', 'text': a },
      })),
    }));
  }

  return blocks;
});

useHead({
  script: () => get(jsonLd).map(block => ({
    type: 'application/ld+json',
    innerHTML: block.replaceAll('<', '\\u003c'),
  })),
});

definePageMeta({
  landing: true,
});
</script>

<template>
  <div>
    <section class="py-10 md:py-20 bg-rui-primary/[.04]">
      <div class="container">
        <div class="max-w-[820px]">
          <span class="text-h6 text-rui-primary uppercase tracking-wide font-bold">
            {{ t('features.header') }}
          </span>
          <div class="w-16 h-1 bg-rui-primary rounded-full mt-4" />
          <h1 class="text-h4 md:text-h3 font-bold mt-4">
            {{ t('features.title') }}
          </h1>
          <p
            v-if="hubData"
            class="text-body-1 mt-4"
          >
            {{ hubData.intro }}
          </p>
        </div>
      </div>
    </section>

    <section
      v-if="keyTakeaways.length > 0"
      class="py-10 md:py-14"
    >
      <div class="container">
        <h2 class="text-h5 font-bold mb-6">
          {{ t('features.hub.takeaways_title') }}
        </h2>
        <div class="max-w-3xl border border-rui-primary/20 border-l-4 border-l-rui-primary bg-rui-primary/[.04] rounded-r-xl p-6 md:p-8">
          <ul class="space-y-3">
            <li
              v-for="takeaway in keyTakeaways"
              :key="takeaway"
              class="flex items-start gap-3 text-body-1"
            >
              <RuiIcon
                name="lu-circle-check"
                size="20"
                color="primary"
                class="shrink-0 mt-0.5"
              />
              <span>{{ takeaway }}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section class="py-10 md:py-14 bg-rui-primary/[.04]">
      <div class="container">
        <h2 class="text-h5 font-bold mb-6">
          {{ t('features.hub.list_title') }}
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <NuxtLink
            v-for="item in items"
            :key="item.path"
            :to="item.path"
            class="flex items-start gap-4 border border-rui-grey-200 rounded-xl p-5 bg-white hover:border-rui-primary transition-colors"
          >
            <div class="w-12 h-12 border border-rui-grey-200 rounded-lg p-2 bg-white shrink-0 flex items-center justify-center">
              <img
                v-if="item.icon"
                :src="item.icon"
                :alt="item.label"
                class="w-full h-full object-contain"
                width="48"
                height="48"
                loading="lazy"
              />
              <RuiIcon
                v-else
                name="lu-sparkles"
                size="24"
                color="primary"
              />
            </div>
            <div>
              <h3 class="text-h6 font-semibold">
                {{ item.label }}
              </h3>
              <p class="text-body-2 text-rui-text-secondary mt-1 line-clamp-2">
                {{ item.tagline }}
              </p>
            </div>
          </NuxtLink>
        </div>
      </div>
    </section>

    <section
      v-if="rotkiHighlights.length > 0"
      class="py-10 md:py-14"
    >
      <div class="container">
        <h2 class="text-h5 font-bold mb-4">
          {{ t('features.hub.why_title') }}
        </h2>
        <ul class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          <li
            v-for="highlight in rotkiHighlights"
            :key="highlight"
            class="flex items-start gap-3 text-body-1"
          >
            <RuiIcon
              name="lu-circle-check"
              size="20"
              color="primary"
              class="shrink-0 mt-0.5"
            />
            <span>{{ highlight }}</span>
          </li>
        </ul>
      </div>
    </section>

    <section
      v-if="hubData"
      class="py-10 md:py-14 bg-rui-primary/[.04]"
    >
      <div class="container">
        <div class="max-w-[820px]">
          <ContentRenderer :value="hubData" />
        </div>
      </div>
    </section>

    <section
      v-if="faq.length > 0"
      class="py-10 md:py-14"
    >
      <div class="container">
        <h2 class="text-h5 font-bold mb-6">
          {{ t('features.hub.faq_title') }}
        </h2>
        <div class="space-y-4 max-w-3xl">
          <div
            v-for="entry in faq"
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
  </div>
</template>
