<script setup lang="ts">
import type { ComparisonHubCollectionItem, ComparisonsCollectionItem } from '@nuxt/content';
import { get } from '@vueuse/shared';
import { usePageSeo } from '~/composables/use-page-seo';

const { t } = useI18n({ useScope: 'global' });
const { public: { baseUrl } } = useRuntimeConfig();

usePageSeo(
  t('compare.title'),
  t('compare.description'),
  '/compare',
);

const { data: hub } = await useAsyncData(
  'comparison-hub',
  () => queryCollection('comparisonHub').first(),
  { dedupe: 'defer' },
);

const { data: comparisons } = await useAsyncData(
  'comparisons-hub',
  () => queryCollection('comparisons').order('competitor', 'ASC').all(),
  { dedupe: 'defer' },
);

const items = computed<ComparisonsCollectionItem[]>(() => get(comparisons) ?? []);
const hubData = computed<ComparisonHubCollectionItem | undefined>(() => get(hub) ?? undefined);
const keyTakeaways = computed<string[]>(() => get(hubData)?.keyTakeaways ?? []);
const rotkiHighlights = computed<string[]>(() => get(hubData)?.rotkiHighlights ?? []);
const faq = computed<{ q: string; a: string }[]>(() => get(hubData)?.faq ?? []);

const jsonLd = computed<string[]>(() => {
  const list = get(items);
  const blocks: string[] = [];

  blocks.push(JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    'name': 'rotki crypto tax software comparisons',
    'description': t('compare.description'),
    'url': `${baseUrl}/compare`,
    'numberOfItems': list.length,
    'itemListElement': list.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': `rotki vs ${item.competitor}`,
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
            {{ t('compare.header') }}
          </span>
          <div class="w-16 h-1 bg-rui-primary rounded-full mt-4" />
          <h1 class="text-h4 md:text-h3 font-bold mt-4">
            {{ t('compare.title') }}
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
          {{ t('compare.hub.takeaways_title') }}
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
          {{ t('compare.hub.summary_title') }}
        </h2>
        <div class="overflow-x-auto border border-rui-grey-200 rounded-xl bg-white">
          <table class="w-full border-collapse text-left">
            <thead>
              <tr class="border-b border-rui-grey-200 bg-rui-primary/[.04]">
                <th class="p-4 text-body-2 font-bold text-rui-text-secondary">
                  {{ t('compare.hub.col_tool') }}
                </th>
                <th class="p-4 text-body-2 font-bold text-rui-text-secondary">
                  {{ t('compare.hub.col_storage') }}
                </th>
                <th class="p-4 text-body-2 font-bold text-rui-text-secondary">
                  {{ t('compare.hub.col_open_source') }}
                </th>
                <th class="p-4 text-body-2 font-bold text-rui-text-secondary">
                  {{ t('compare.hub.col_custody') }}
                </th>
                <th class="p-4 text-body-2 font-bold text-rui-text-secondary">
                  {{ t('compare.hub.col_deployment') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-b border-rui-grey-100 bg-rui-primary/[.07]">
                <th
                  scope="row"
                  class="p-4 text-body-1 font-bold text-rui-primary border-l-4 border-rui-primary"
                >
                  rotki
                </th>
                <td class="p-4 text-body-2 font-medium text-rui-text">
                  {{ t('compare.hub.rotki_storage') }}
                </td>
                <td class="p-4 text-body-2 font-medium text-rui-text">
                  <span class="inline-flex items-center gap-2">
                    <RuiIcon
                      name="lu-circle-check"
                      size="18"
                      color="success"
                      class="shrink-0"
                    />
                    {{ t('compare.hub.rotki_open_source') }}
                  </span>
                </td>
                <td class="p-4 text-body-2 font-medium text-rui-text">
                  <span class="inline-flex items-center gap-2">
                    <RuiIcon
                      name="lu-circle-check"
                      size="18"
                      color="success"
                      class="shrink-0"
                    />
                    {{ t('compare.hub.rotki_custody') }}
                  </span>
                </td>
                <td class="p-4 text-body-2 font-medium text-rui-text">
                  {{ t('compare.hub.rotki_deployment') }}
                </td>
              </tr>
              <tr
                v-for="item in items"
                :key="item.path"
                class="border-b border-rui-grey-100 last:border-b-0"
              >
                <th
                  scope="row"
                  class="p-4 text-body-2 font-medium border-l-4 border-transparent"
                >
                  <NuxtLink
                    :to="item.path"
                    class="text-rui-text hover:text-rui-primary"
                  >
                    {{ item.competitor }}
                  </NuxtLink>
                </th>
                <td class="p-4 text-body-2 text-rui-text-secondary">
                  {{ t('compare.hub.competitor_storage') }}
                </td>
                <td class="p-4 text-body-2 text-rui-text-secondary">
                  <span class="inline-flex items-center gap-2">
                    <RuiIcon
                      name="lu-circle-x"
                      size="18"
                      color="error"
                      class="shrink-0 opacity-70"
                    />
                    {{ t('compare.hub.competitor_open_source') }}
                  </span>
                </td>
                <td class="p-4 text-body-2 text-rui-text-secondary">
                  <span class="inline-flex items-center gap-2">
                    <RuiIcon
                      name="lu-circle-x"
                      size="18"
                      color="error"
                      class="shrink-0 opacity-70"
                    />
                    {{ t('compare.hub.competitor_custody') }}
                  </span>
                </td>
                <td class="p-4 text-body-2 text-rui-text-secondary">
                  {{ t('compare.hub.competitor_deployment') }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </section>

    <section class="py-10 md:py-14">
      <div class="container">
        <h2 class="text-h5 font-bold mb-6">
          {{ t('compare.hub.list_title') }}
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <NuxtLink
            v-for="item in items"
            :key="item.path"
            :to="item.path"
            class="flex items-start gap-4 border border-rui-grey-200 rounded-xl p-5 bg-white hover:border-rui-primary transition-colors"
          >
            <div class="w-12 h-12 border border-rui-grey-200 rounded-lg p-2 bg-white shrink-0">
              <img
                :src="item.image"
                :alt="item.competitor"
                class="w-full h-full object-contain"
                width="48"
                height="48"
                loading="lazy"
              />
            </div>
            <div>
              <h3 class="text-h6 font-semibold">
                rotki vs {{ item.competitor }}
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
      class="py-10 md:py-14 bg-rui-primary/[.04]"
    >
      <div class="container">
        <h2 class="text-h5 font-bold mb-4">
          {{ t('compare.hub.why_title') }}
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
      class="py-10 md:py-14"
    >
      <div class="container">
        <div class="max-w-[820px]">
          <ContentRenderer :value="hubData" />
        </div>
      </div>
    </section>

    <section
      v-if="faq.length > 0"
      class="py-10 md:py-14 bg-rui-primary/[.04]"
    >
      <div class="container">
        <h2 class="text-h5 font-bold mb-6">
          {{ t('compare.hub.faq_title') }}
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
