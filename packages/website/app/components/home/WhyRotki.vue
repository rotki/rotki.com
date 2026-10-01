<script setup lang="ts">
import type { RuiIcons } from '@rotki/ui-library';
import type { IntegrationItem } from '~/types/integrations';
import { get } from '@vueuse/shared';
import ButtonLink from '~/components/common/ButtonLink.vue';
import { useIntegrationsData } from '~/composables/use-integrations-data';
import { integrationSlug } from '~/utils/integration-slug';

interface Pillar {
  icon: RuiIcons;
  title: string;
  description: string;
}

/**
 * Hand-picked so the strip reads as "the ones you use" rather than an
 * alphabetical slice. Labels missing from the catalog are skipped.
 */
const FEATURED_LABELS: readonly string[] = [
  'Ethereum',
  'Bitcoin',
  'Solana',
  'Arbitrum One',
  'Base',
  'Optimism',
  'Kraken',
  'Coinbase',
  'Binance',
  'Bitstamp',
  'OKX',
  'Bybit',
  'Aave',
  'Uniswap',
  'Lido eth',
  'Curve.fi',
  'EigenLayer',
  'Pendle Finance',
];

/** Three rows on the 3-column phone grid; the rest only appear from `sm` up. */
const MOBILE_FEATURED_COUNT = 9;

const { t } = useI18n({ useScope: 'global' });

const { data, integrationCount } = useIntegrationsData();

const pillars: Pillar[] = [
  {
    icon: 'lu-lock',
    title: t('home.why_rotki.pillars.local.title'),
    description: t('home.why_rotki.pillars.local.description'),
  },
  {
    icon: 'lu-code-xml',
    title: t('home.why_rotki.pillars.open_source.title'),
    description: t('home.why_rotki.pillars.open_source.description'),
  },
  {
    icon: 'lu-key-round',
    title: t('home.why_rotki.pillars.read_only.title'),
    description: t('home.why_rotki.pillars.read_only.description'),
  },
];

const featured = computed<IntegrationItem[]>(() => {
  const { blockchains, exchanges, protocols } = get(data);
  const all = [...blockchains, ...exchanges, ...protocols];
  return FEATURED_LABELS
    .map(label => all.find(item => item.label === label))
    .filter((item): item is IntegrationItem => item !== undefined);
});
</script>

<template>
  <section class="py-16 md:py-24">
    <div class="container flex flex-col gap-16 md:gap-20">
      <div class="flex flex-col gap-10">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div class="flex flex-col gap-3 max-w-[640px]">
            <h2 class="text-h4 !font-bold">
              {{ t('home.why_rotki.title') }}
            </h2>
            <p class="text-body-1 text-rui-text-secondary">
              {{ t('home.why_rotki.detail') }}
            </p>
          </div>
          <ButtonLink
            to="/compare"
            color="primary"
            class="self-start md:self-auto !whitespace-normal text-left -ml-3 md:ml-0"
          >
            {{ t('home.why_rotki.compare') }}
            <template #append>
              <RuiIcon
                name="lu-arrow-right"
                size="18"
              />
            </template>
          </ButtonLink>
        </div>
        <ul class="grid md:grid-cols-3 gap-4 md:gap-6">
          <li
            v-for="pillar in pillars"
            :key="pillar.title"
            class="flex flex-col gap-3 rounded-xl border border-rui-grey-200 p-6"
          >
            <span class="flex items-center justify-center size-10 rounded-lg bg-rui-primary/[0.08] text-rui-primary">
              <RuiIcon :name="pillar.icon" />
            </span>
            <h3 class="text-h6">
              {{ pillar.title }}
            </h3>
            <p class="text-body-2 text-rui-text-secondary">
              {{ pillar.description }}
            </p>
          </li>
        </ul>
      </div>

      <div class="flex flex-col items-center gap-8 text-center">
        <h3 class="text-h5 !font-bold max-w-[640px]">
          {{ t('home.why_rotki.integrations', { count: integrationCount }) }}
        </h3>
        <ul class="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-9 gap-3 w-full">
          <li
            v-for="(item, index) in featured"
            :key="item.label"
            :class="{ 'hidden sm:block': index >= MOBILE_FEATURED_COUNT }"
          >
            <NuxtLink
              :to="`/integrations/${integrationSlug(item.label)}`"
              class="flex flex-col items-center gap-2 rounded-xl border border-rui-grey-200 px-2 py-4 h-full hover:border-rui-primary/40 hover:shadow-sm transition-all"
            >
              <img
                :src="item.image"
                :alt="item.label"
                width="32"
                height="32"
                loading="lazy"
                class="size-8 object-contain"
              />
              <span class="text-caption text-rui-text-secondary line-clamp-1">
                {{ item.label }}
              </span>
            </NuxtLink>
          </li>
        </ul>
        <ButtonLink
          to="/integrations"
          color="primary"
          variant="outlined"
        >
          {{ t('home.why_rotki.all_integrations') }}
        </ButtonLink>
      </div>
    </div>
  </section>
</template>
