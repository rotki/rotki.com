<script setup lang="ts">
import type { RuiIcons } from '@rotki/ui-library';
import { get } from '@vueuse/shared';
import { usePlanLimits } from '~/composables/tiers/use-plan-limits';

interface ProductFeature {
  icon: RuiIcons;
  title: string;
  description: string;
  /** Not part of the Supporter plan; mirrors the live tier flags (graphs_view, mcp, ...). */
  basicAndUp?: boolean;
}

const { t } = useI18n({ useScope: 'global' });

const limits = usePlanLimits();

const data = computed<ProductFeature[]>(() => [
  {
    icon: 'lu-trending-up',
    title: t('products.features.scales_with_your_need.title'),
    description: t('products.features.scales_with_your_need.description', {
      supporter: get(limits).supporter.events,
      basic: get(limits).basic.events,
      advanced: get(limits).advanced.events,
    }),
  },
  {
    icon: 'lu-bot',
    title: t('products.features.mcp.title'),
    description: t('products.features.mcp.description'),
    basicAndUp: true,
  },
  {
    icon: 'lu-link',
    title: t('products.features.asset_matching.title'),
    description: t('products.features.asset_matching.description'),
    basicAndUp: true,
  },
  {
    icon: 'lu-cloud-upload',
    title: t('products.features.sync_db_with_server.title'),
    description: t('products.features.sync_db_with_server.description'),
    basicAndUp: true,
  },
  {
    icon: 'lu-chart-pie',
    title: t('products.features.detailed_graphs.title'),
    description: t('products.features.detailed_graphs.description'),
    basicAndUp: true,
  },
  {
    icon: 'lu-chart-no-axes-column',
    title: t('products.features.events_analysis.title'),
    description: t('products.features.events_analysis.description'),
    basicAndUp: true,
  },
  {
    icon: 'lu-layers',
    title: t('products.features.staking.title'),
    description: t('products.features.staking.description'),
    basicAndUp: true,
  },
  {
    icon: 'lu-life-buoy',
    title: t('products.features.support.title'),
    description: t('products.features.support.description'),
    basicAndUp: true,
  },
  {
    icon: 'lu-receipt-text',
    title: t('products.features.enriched_transactions.title'),
    description: t('products.features.enriched_transactions.description'),
    basicAndUp: true,
  },
]);
</script>

<template>
  <div>
    <div class="container">
      <!-- The cards follow the hero directly, so their section heading is for assistive tech and the outline only -->
      <h2 class="sr-only">
        {{ t('products.features.overview_title') }}
      </h2>
      <div class="grid md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
        <div
          v-for="item in data"
          :key="item.title"
          class="rounded-xl border border-rui-grey-200 p-6 flex flex-col gap-3"
        >
          <span class="flex items-center justify-center size-10 rounded-lg bg-rui-primary text-white">
            <RuiIcon :name="item.icon" />
          </span>
          <h3 class="text-h6">
            {{ item.title }}
          </h3>
          <p class="text-rui-text-secondary text-body-2 grow">
            {{ item.description }}
          </p>
          <span
            v-if="item.basicAndUp"
            class="self-start rounded-full bg-rui-primary/[0.08] px-2.5 py-0.5 text-caption font-medium text-rui-primary"
          >
            {{ t('home.premium_features.basic_and_up') }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>
