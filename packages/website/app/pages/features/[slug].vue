<script setup lang="ts">
import { isDefined } from '@vueuse/core';
import { get } from '@vueuse/shared';
import ButtonLink from '~/components/common/ButtonLink.vue';
import { usePageSeo } from '~/composables/use-page-seo';

const { path } = useRoute();
const { t } = useI18n({ useScope: 'global' });
const { public: { baseUrl } } = useRuntimeConfig();

const { data: feature } = await useAsyncData(
  path,
  () => queryCollection('features').path(path).first(),
  { dedupe: 'defer' },
);

if (!isDefined(feature)) {
  showError({ message: `Page not found: ${path}`, status: 404 });
}
else {
  const item = get(feature);
  const slug = path.replace(/\/+$/, '').split('/').pop() ?? '';
  // Keep the SERP title short (<60 chars); titleTemplate appends " | rotki".
  const title = item.label;
  // OG image is generated per-slug at build time by the feature-seo module
  // (with a share.png fallback written to the same path), so this URL always resolves.
  usePageSeo(title, item.metaDescription, path, { keywords: item.keywords, ogImage: `features/${slug}.png` });

  const url = `${baseUrl}${path}`;

  const ldBlocks: string[] = [];

  ldBlocks.push(JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': [
      { '@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': baseUrl },
      { '@type': 'ListItem', 'position': 2, 'name': 'Features', 'item': `${baseUrl}/features` },
      { '@type': 'ListItem', 'position': 3, 'name': item.label, 'item': url },
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

const tierBadge = computed<string | undefined>(() => {
  const item = get(feature);
  if (!item)
    return undefined;

  switch (item.ctaPlan) {
    case 'basic': return t('features.detail.tier.basic');
    case 'advanced': return t('features.detail.tier.advanced');
    default: return undefined;
  }
});

definePageMeta({
  landing: true,
});
</script>

<template>
  <div v-if="feature">
    <section class="py-10 md:py-16 bg-rui-primary/[.04]">
      <div class="container">
        <nav class="text-sm text-rui-text-secondary mb-4">
          <NuxtLink
            to="/features"
            class="hover:text-rui-primary"
          >
            {{ t('features.header') }}
          </NuxtLink>
          <span class="mx-2">/</span>
          <span>{{ feature.label }}</span>
        </nav>
        <div class="flex items-center gap-4 md:gap-5">
          <div class="w-16 h-16 md:w-20 md:h-20 border-2 border-rui-primary rounded-xl p-3 bg-white shadow-sm shrink-0 flex items-center justify-center">
            <img
              v-if="feature.icon"
              :src="feature.icon"
              :alt="feature.label"
              class="w-full h-full object-contain"
              width="80"
              height="80"
              loading="eager"
            />
            <RuiIcon
              v-else
              name="lu-sparkles"
              size="36"
              color="primary"
            />
          </div>
        </div>
        <div class="w-16 h-1 bg-rui-primary rounded-full mt-8" />
        <h1 class="text-h4 md:text-h3 font-bold mt-4">
          {{ feature.tagline }}
        </h1>
        <p class="text-body-1 text-rui-text-secondary mt-4 max-w-3xl">
          {{ feature.intro }}
        </p>
        <div class="flex items-center gap-3 mt-5">
          <span
            v-if="tierBadge"
            class="inline-flex items-center rounded-full bg-rui-primary/10 text-rui-primary text-body-2 font-medium px-3 py-1"
          >
            {{ tierBadge }}
          </span>
          <span class="block text-body-2 text-rui-text-secondary">
            {{ t('features.detail.updated', { date: feature.updatedAt }) }}
          </span>
        </div>
      </div>
    </section>

    <section
      v-if="(feature.keyTakeaways?.length ?? 0) > 0"
      class="py-10 md:py-14"
    >
      <div class="container">
        <div class="max-w-3xl border border-rui-primary/20 border-l-4 border-l-rui-primary bg-rui-primary/[.04] rounded-r-xl p-6 md:p-8">
          <h2 class="text-h6 font-bold mb-4 uppercase tracking-wide text-rui-primary">
            {{ t('features.detail.takeaways_title') }}
          </h2>
          <ul class="space-y-3">
            <li
              v-for="takeaway in feature.keyTakeaways"
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

    <section
      v-if="(feature.capabilities?.length ?? 0) > 0"
      class="py-10 md:py-14 bg-rui-primary/[.04]"
    >
      <div class="container">
        <h2 class="text-h5 font-bold mb-4">
          {{ t('features.detail.capabilities_title') }}
        </h2>
        <ul class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
          <li
            v-for="capability in feature.capabilities"
            :key="capability"
            class="flex items-start gap-3 text-body-1"
          >
            <RuiIcon
              name="lu-circle-check"
              size="20"
              color="primary"
              class="shrink-0 mt-0.5"
            />
            <span>{{ capability }}</span>
          </li>
        </ul>
      </div>
    </section>

    <section
      v-if="(feature.setup?.length ?? 0) > 0"
      class="py-10 md:py-14"
    >
      <div class="container">
        <h2 class="text-h5 font-bold mb-6">
          {{ t('features.detail.setup_title') }}
        </h2>
        <ol class="space-y-4 max-w-3xl">
          <li
            v-for="(step, index) in feature.setup"
            :key="step"
            class="flex items-start gap-4 text-body-1"
          >
            <span class="flex items-center justify-center w-8 h-8 rounded-full bg-rui-primary text-white text-body-2 font-bold shrink-0">
              {{ index + 1 }}
            </span>
            <span class="mt-1">{{ step }}</span>
          </li>
        </ol>
      </div>
    </section>

    <section
      v-if="(feature.limitations?.length ?? 0) > 0"
      class="py-10 md:py-14 bg-rui-primary/[.04]"
    >
      <div class="container">
        <h2 class="text-h5 font-bold mb-4">
          {{ t('features.detail.limitations_title') }}
        </h2>
        <ul class="space-y-3 max-w-3xl">
          <li
            v-for="limitation in feature.limitations"
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

    <section class="py-10 md:py-14">
      <div class="container">
        <h2 class="text-h5 font-bold mb-6">
          {{ t('features.detail.deepdive_title', { label: feature.label }) }}
        </h2>
        <div class="max-w-[820px]">
          <ContentRenderer :value="feature" />
        </div>
      </div>
    </section>

    <section
      v-if="(feature.troubleshooting?.length ?? 0) > 0"
      class="py-10 md:py-14 bg-rui-primary/[.04]"
    >
      <div class="container">
        <h2 class="text-h5 font-bold mb-6">
          {{ t('features.detail.troubleshooting_title') }}
        </h2>
        <div class="space-y-4 max-w-3xl">
          <div
            v-for="entry in feature.troubleshooting"
            :key="entry.problem"
            class="border border-rui-grey-200 rounded-xl p-5 bg-white"
          >
            <h3 class="text-h6 font-semibold mb-1 flex items-start gap-2">
              <RuiIcon
                name="lu-circle-alert"
                size="20"
                color="primary"
                class="shrink-0 mt-0.5"
              />
              <span>{{ entry.problem }}</span>
            </h3>
            <p class="text-body-1 text-rui-text-secondary pl-7">
              {{ entry.fix }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <section
      v-if="(feature.relatedIntegrations?.length ?? 0) > 0 || (feature.relatedComparisons?.length ?? 0) > 0 || (feature.relatedFeatures?.length ?? 0) > 0"
      class="py-10 md:py-14"
    >
      <div class="container space-y-8">
        <div v-if="(feature.relatedIntegrations?.length ?? 0) > 0">
          <h2 class="text-h6 font-bold mb-4">
            {{ t('features.detail.related_integrations') }}
          </h2>
          <div class="flex flex-wrap gap-3">
            <NuxtLink
              v-for="related in feature.relatedIntegrations"
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
        <div v-if="(feature.relatedComparisons?.length ?? 0) > 0">
          <h2 class="text-h6 font-bold mb-4">
            {{ t('features.detail.related_comparisons') }}
          </h2>
          <div class="flex flex-wrap gap-3">
            <NuxtLink
              v-for="related in feature.relatedComparisons"
              :key="related.slug"
              :to="`/compare/${related.slug}`"
              class="inline-flex items-center gap-2 border border-rui-grey-200 rounded-full px-4 py-2 text-body-2 bg-white hover:border-rui-primary hover:text-rui-primary transition-colors"
            >
              {{ related.label }}
            </NuxtLink>
          </div>
        </div>
        <div v-if="(feature.relatedFeatures?.length ?? 0) > 0">
          <h2 class="text-h6 font-bold mb-4">
            {{ t('features.detail.related_features') }}
          </h2>
          <div class="flex flex-wrap gap-3">
            <NuxtLink
              v-for="related in feature.relatedFeatures"
              :key="related.slug"
              :to="`/features/${related.slug}`"
              class="inline-flex items-center gap-2 border border-rui-grey-200 rounded-full px-4 py-2 text-body-2 bg-white hover:border-rui-primary hover:text-rui-primary transition-colors"
            >
              {{ related.label }}
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <section
      v-if="(feature.faq?.length ?? 0) > 0"
      class="py-10 md:py-14 bg-rui-primary/[.04]"
    >
      <div class="container">
        <h2 class="text-h5 font-bold mb-6">
          {{ t('features.detail.faq_title') }}
        </h2>
        <div class="space-y-4 max-w-3xl">
          <div
            v-for="entry in feature.faq"
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
            {{ t('features.detail.cta.title') }}
          </h2>
          <p class="text-body-1 text-rui-text-secondary">
            {{ t('features.detail.cta.description') }}
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <ButtonLink
            to="/download"
            color="primary"
            variant="default"
          >
            {{ t('features.detail.cta.download') }}
          </ButtonLink>
          <ButtonLink
            to="/features"
            variant="outlined"
          >
            {{ t('features.detail.cta.all') }}
          </ButtonLink>
        </div>
      </div>
    </section>
  </div>
</template>
