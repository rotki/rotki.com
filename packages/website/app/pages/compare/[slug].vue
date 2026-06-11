<script setup lang="ts">
import { isDefined } from '@vueuse/core';
import { get } from '@vueuse/shared';
import ButtonLink from '~/components/common/ButtonLink.vue';
import ComparisonTable from '~/components/comparison/ComparisonTable.vue';
import { usePageSeo } from '~/composables/use-page-seo';

const { path } = useRoute();
const { t } = useI18n({ useScope: 'global' });
const { public: { baseUrl } } = useRuntimeConfig();

const { data: comparison } = await useAsyncData(
  path,
  () => queryCollection('comparisons').path(path).first(),
  { dedupe: 'defer' },
);

if (!isDefined(comparison)) {
  showError({ message: `Page not found: ${path}`, status: 404 });
}
else {
  const item = get(comparison);
  const slug = path.replace(/\/+$/, '').split('/').pop() ?? '';
  // Keep the SERP title short (<60 chars); titleTemplate appends " | rotki".
  // The full positioning still lives in the <h1>, tagline, and meta description.
  const title = `rotki vs ${item.competitor}`;
  // OG image is generated per-slug at build time by the comparison-seo module
  // (with a share.png fallback written to the same path), so this URL always resolves.
  usePageSeo(title, item.metaDescription, path, { keywords: item.keywords, ogImage: `compare/${slug}.png` });

  const url = `${baseUrl}${path}`;

  const ldBlocks: string[] = [];

  ldBlocks.push(JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': baseUrl },
      { '@type': 'ListItem', 'position': 2, 'name': 'Compare', 'item': `${baseUrl}/compare` },
      { '@type': 'ListItem', 'position': 3, 'name': `rotki vs ${item.competitor}`, 'item': url },
    ],
  }));

  ldBlocks.push(JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    'name': 'rotki',
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

definePageMeta({
  landing: true,
});
</script>

<template>
  <div v-if="comparison">
    <section class="py-10 md:py-16 bg-rui-primary/[.04]">
      <div class="container">
        <nav class="text-sm text-rui-text-secondary mb-4">
          <NuxtLink
            to="/compare"
            class="hover:text-rui-primary"
          >
            {{ t('compare.header') }}
          </NuxtLink>
          <span class="mx-2">/</span>
          <span>rotki vs {{ comparison.competitor }}</span>
        </nav>
        <div class="flex items-center gap-4 md:gap-5">
          <div class="w-16 h-16 md:w-20 md:h-20 border border-rui-grey-200 rounded-xl p-3 bg-white shadow-sm shrink-0 flex items-center justify-center">
            <img
              :src="comparison.image"
              :alt="comparison.competitor"
              class="w-full h-full object-contain"
              width="80"
              height="80"
              loading="eager"
            />
          </div>
          <span class="text-h6 md:text-h5 font-bold text-rui-text-secondary uppercase tracking-wide">vs</span>
          <div class="w-16 h-16 md:w-20 md:h-20 border-2 border-rui-primary rounded-xl p-3 bg-white shadow-sm shrink-0 flex items-center justify-center">
            <img
              src="/img/logo-small.svg"
              alt="rotki"
              class="w-full h-full object-contain"
              width="80"
              height="80"
              loading="eager"
            />
          </div>
        </div>
        <div class="w-16 h-1 bg-rui-primary rounded-full mt-8" />
        <h1 class="text-h4 md:text-h3 font-bold mt-4">
          {{ comparison.tagline }}
        </h1>
        <p class="text-body-1 text-rui-text-secondary mt-4 max-w-3xl">
          {{ comparison.intro }}
        </p>
        <span class="block text-body-2 text-rui-text-secondary mt-5">
          {{ t('compare.detail.updated', { date: comparison.updatedAt }) }}
        </span>
      </div>
    </section>

    <section
      v-if="(comparison.keyTakeaways?.length ?? 0) > 0"
      class="py-10 md:py-14"
    >
      <div class="container">
        <div class="max-w-3xl border border-rui-primary/20 border-l-4 border-l-rui-primary bg-rui-primary/[.04] rounded-r-xl p-6 md:p-8">
          <h2 class="text-h6 font-bold mb-4 uppercase tracking-wide text-rui-primary">
            {{ t('compare.detail.takeaways_title') }}
          </h2>
          <ul class="space-y-3">
            <li
              v-for="takeaway in comparison.keyTakeaways"
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

    <section class="py-10 md:py-14">
      <div class="container">
        <div class="border-l-4 border-rui-primary bg-rui-primary/[.04] rounded-r-xl p-6 max-w-3xl">
          <h2 class="text-h6 font-bold mb-2">
            {{ t('compare.detail.verdict') }}
          </h2>
          <p class="text-body-1 text-rui-text-secondary">
            {{ comparison.verdict }}
          </p>
        </div>
      </div>
    </section>

    <section
      v-if="(comparison.dimensions?.length ?? 0) > 0"
      class="py-10 md:py-14 bg-rui-primary/[.04]"
    >
      <div class="container">
        <h2 class="text-h5 font-bold mb-6">
          {{ t('compare.detail.table_title', { competitor: comparison.competitor }) }}
        </h2>
        <ComparisonTable
          :competitor="comparison.competitor"
          :rows="comparison.dimensions ?? []"
        />
      </div>
    </section>

    <section
      v-if="(comparison.rotkiAdvantages?.length ?? 0) > 0"
      class="py-10 md:py-14"
    >
      <div class="container">
        <h2 class="text-h5 font-bold mb-4">
          {{ t('compare.detail.advantages_title') }}
        </h2>
        <ul class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          <li
            v-for="advantage in comparison.rotkiAdvantages"
            :key="advantage"
            class="flex items-start gap-3 text-body-1"
          >
            <RuiIcon
              name="lu-circle-check"
              size="20"
              color="primary"
              class="shrink-0 mt-0.5"
            />
            <span>{{ advantage }}</span>
          </li>
        </ul>
      </div>
    </section>

    <section
      v-if="(comparison.tradeoffs?.length ?? 0) > 0"
      class="py-10 md:py-14 bg-rui-primary/[.04]"
    >
      <div class="container">
        <h2 class="text-h5 font-bold mb-1">
          {{ t('compare.detail.tradeoffs_title') }}
        </h2>
        <p class="text-body-2 text-rui-text-secondary mb-4 max-w-3xl">
          {{ t('compare.detail.tradeoffs_subtitle', { competitor: comparison.competitor }) }}
        </p>
        <ul class="space-y-3 max-w-3xl">
          <li
            v-for="tradeoff in comparison.tradeoffs"
            :key="tradeoff"
            class="flex items-start gap-3 text-body-1"
          >
            <RuiIcon
              name="lu-circle-alert"
              size="20"
              color="warning"
              class="shrink-0 mt-0.5"
            />
            <span>{{ tradeoff }}</span>
          </li>
        </ul>
      </div>
    </section>

    <section
      v-if="(comparison.whoShouldRotki?.length ?? 0) > 0"
      class="py-10 md:py-14"
    >
      <div class="container">
        <h2 class="text-h5 font-bold mb-6">
          {{ t('compare.detail.who_title') }}
        </h2>
        <div class="border border-rui-primary/30 bg-rui-primary/[.04] rounded-xl p-6 md:p-8 max-w-3xl">
          <h3 class="text-h6 font-semibold mb-4 text-rui-primary">
            {{ t('compare.detail.who_rotki') }}
          </h3>
          <ul class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
            <li
              v-for="who in comparison.whoShouldRotki"
              :key="who"
              class="flex items-start gap-3 text-body-1"
            >
              <RuiIcon
                name="lu-circle-check"
                size="20"
                color="primary"
                class="shrink-0 mt-0.5"
              />
              <span>{{ who }}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>

    <section class="py-10 md:py-14 bg-rui-primary/[.04]">
      <div class="container">
        <h2 class="text-h5 font-bold mb-6">
          {{ t('compare.detail.deepdive_title', { competitor: comparison.competitor }) }}
        </h2>
        <div class="max-w-[820px]">
          <ContentRenderer :value="comparison" />
        </div>
      </div>
    </section>

    <section
      v-if="(comparison.relatedIntegrations?.length ?? 0) > 0"
      class="py-10 md:py-14"
    >
      <div class="container">
        <h2 class="text-h5 font-bold mb-2">
          {{ t('compare.detail.related_title') }}
        </h2>
        <p class="text-body-2 text-rui-text-secondary mb-5 max-w-3xl">
          {{ t('compare.detail.related_subtitle') }}
        </p>
        <div class="flex flex-wrap gap-3">
          <NuxtLink
            v-for="related in comparison.relatedIntegrations"
            :key="related.slug"
            :to="`/integrations/${related.slug}`"
            class="inline-flex items-center gap-2 border border-rui-grey-200 rounded-full px-4 py-2 text-body-2 bg-white hover:border-rui-primary hover:text-rui-primary transition-colors"
          >
            {{ related.label }}
          </NuxtLink>
          <NuxtLink
            to="/integrations"
            class="inline-flex items-center gap-2 border border-rui-primary rounded-full px-4 py-2 text-body-2 text-rui-primary bg-white hover:bg-rui-primary/[.04] transition-colors"
          >
            {{ t('integration.detail.cta.all') }}
          </NuxtLink>
        </div>
      </div>
    </section>

    <section
      v-if="(comparison.faq?.length ?? 0) > 0"
      class="py-10 md:py-14 bg-rui-primary/[.04]"
    >
      <div class="container">
        <h2 class="text-h5 font-bold mb-6">
          {{ t('compare.detail.faq_title') }}
        </h2>
        <div class="space-y-4 max-w-3xl">
          <div
            v-for="entry in comparison.faq"
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
            {{ t('compare.detail.cta.title') }}
          </h2>
          <p class="text-body-1 text-rui-text-secondary">
            {{ t('compare.detail.cta.description') }}
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <ButtonLink
            to="/download"
            color="primary"
            variant="default"
          >
            {{ t('compare.detail.cta.download') }}
          </ButtonLink>
          <ButtonLink
            to="/compare"
            variant="outlined"
          >
            {{ t('compare.detail.cta.all') }}
          </ButtonLink>
          <NuxtLink
            v-if="comparison.competitorUrl"
            :to="comparison.competitorUrl"
            external
            target="_blank"
            rel="nofollow noopener"
            class="text-body-2 text-rui-text-secondary self-center underline hover:text-rui-primary"
          >
            {{ t('compare.detail.visit_competitor', { competitor: comparison.competitor }) }}
          </NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>
