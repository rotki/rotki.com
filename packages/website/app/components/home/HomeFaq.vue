<script setup lang="ts">
import { get } from '@vueuse/shared';
import { usePlanLimits } from '~/composables/tiers/use-plan-limits';

const { t } = useI18n({ useScope: 'global' });

// The free limit is an app constant, so the FAQ (and its JSON-LD) can be built once at render time
const { free } = get(usePlanLimits());

const entries: { q: string; a: string }[] = [
  { q: t('home.faq.free.q'), a: t('home.faq.free.a', { free }) },
  { q: t('home.faq.data.q'), a: t('home.faq.data.a') },
  { q: t('home.faq.integrations.q'), a: t('home.faq.integrations.a') },
  { q: t('home.faq.taxes.q'), a: t('home.faq.taxes.a') },
  { q: t('home.faq.platforms.q'), a: t('home.faq.platforms.a') },
  { q: t('home.faq.account.q'), a: t('home.faq.account.a') },
];

useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      'mainEntity': entries.map(({ q, a }) => ({
        '@type': 'Question',
        'name': q,
        'acceptedAnswer': { '@type': 'Answer', 'text': a },
      })),
    }).replaceAll('<', '\\u003c'),
  }],
});
</script>

<template>
  <section class="py-16 md:py-24 bg-rui-grey-50">
    <div class="container grid lg:grid-cols-[1fr_2fr] gap-10 lg:gap-16">
      <div class="flex flex-col gap-3">
        <h2 class="text-h4 !font-bold">
          {{ t('home.faq.title') }}
        </h2>
        <i18n-t
          tag="p"
          scope="global"
          keypath="home.faq.more"
          class="text-body-1 text-rui-text-secondary"
        >
          <template #docs>
            <a
              href="https://docs.rotki.com"
              target="_blank"
              rel="noopener"
              class="text-rui-primary underline"
            >
              {{ t('home.faq.docs') }}
            </a>
          </template>
        </i18n-t>
      </div>
      <div class="flex flex-col gap-3">
        <details
          v-for="(entry, index) in entries"
          :key="entry.q"
          class="group rounded-xl border border-rui-grey-200 bg-white px-6 open:pb-5"
          :open="index === 0"
        >
          <summary class="flex items-center justify-between gap-4 py-5 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <h3 class="text-subtitle-1 font-medium">
              {{ entry.q }}
            </h3>
            <RuiIcon
              name="lu-chevron-down"
              size="20"
              class="shrink-0 text-rui-text-secondary transition-transform group-open:rotate-180"
            />
          </summary>
          <p class="text-body-1 text-rui-text-secondary">
            {{ entry.a }}
          </p>
        </details>
      </div>
    </div>
  </section>
</template>
