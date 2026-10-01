<script setup lang="ts">
import type { RuiIcons } from '@rotki/ui-library';
import { get } from '@vueuse/shared';
import ButtonLink from '~/components/common/ButtonLink.vue';
import { usePlanLimits } from '~/composables/tiers/use-plan-limits';

const { t } = useI18n({ useScope: 'global' });

const limits = usePlanLimits();

interface PremiumFeature {
  icon: RuiIcons;
  text: string;
  description: string;
  /** Not part of the Supporter plan; mirrors the live tier flags (graphs_view, mcp, ...). */
  basicAndUp?: boolean;
}

const data = computed<PremiumFeature[]>(() => [
  {
    icon: 'lu-history',
    text: t('home.premium_features.features.history.title'),
    description: t('home.premium_features.features.history.detail', {
      free: get(limits).free,
      supporter: get(limits).supporter.events,
      basic: get(limits).basic.events,
      advanced: get(limits).advanced.events,
    }),
  },
  {
    icon: 'lu-chart-pie',
    text: t('home.premium_features.features.graphs_and_statistics.title'),
    description: t('home.premium_features.features.graphs_and_statistics.detail'),
    basicAndUp: true,
  },
  {
    icon: 'lu-bot',
    text: t('home.premium_features.features.mcp.title'),
    description: t('home.premium_features.features.mcp.detail'),
    basicAndUp: true,
  },
  {
    icon: 'lu-link',
    text: t('home.premium_features.features.asset_matching.title'),
    description: t('home.premium_features.features.asset_matching.detail'),
    basicAndUp: true,
  },
  {
    icon: 'lu-layers',
    text: t('home.premium_features.features.premium_staking.title'),
    description: t('home.premium_features.features.premium_staking.detail', {
      basic: get(limits).basic.ethStaked,
      advanced: get(limits).advanced.ethStaked,
    }),
    basicAndUp: true,
  },
  {
    icon: 'lu-cloud-upload',
    text: t('home.premium_features.features.sync.title'),
    description: t('home.premium_features.features.sync.detail'),
    basicAndUp: true,
  },
]);
</script>

<template>
  <section class="py-16 md:py-24 bg-rui-grey-50">
    <div class="container">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-12">
        <div class="flex flex-col gap-3 max-w-[640px]">
          <h2 class="text-h4 !font-bold">
            {{ t('home.premium_features.title') }}
          </h2>
          <p class="text-body-1 text-rui-text-secondary">
            {{ t('home.premium_features.subtitle') }}
          </p>
        </div>
        <div class="flex flex-wrap gap-3">
          <!-- The plans table is the next section, so this scrolls to it instead of leaving the page -->
          <ButtonLink
            :to="{ hash: '#pricing' }"
            color="primary"
            variant="default"
            rounded
            size="lg"
          >
            {{ t('home.premium_features.compare_plans') }}
          </ButtonLink>
          <ButtonLink
            to="/products"
            color="primary"
            variant="outlined"
            rounded
            size="lg"
          >
            {{ t('home.premium_features.whats_included') }}
          </ButtonLink>
        </div>
      </div>
      <ul class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <li
          v-for="item in data"
          :key="item.text"
          class="flex sm:flex-col gap-4 sm:gap-3 rounded-xl border border-rui-grey-200 bg-white p-5 sm:p-6"
        >
          <span class="shrink-0 flex items-center justify-center size-10 rounded-lg bg-rui-primary text-white">
            <RuiIcon :name="item.icon" />
          </span>
          <div class="flex flex-col gap-1 sm:gap-3">
            <h3 class="text-h6">
              {{ item.text }}
            </h3>
            <p class="text-body-2 text-rui-text-secondary">
              {{ item.description }}
            </p>
            <span
              v-if="item.basicAndUp"
              class="self-start rounded-full bg-rui-primary/[0.08] px-2.5 py-0.5 text-caption font-medium text-rui-primary"
            >
              {{ t('home.premium_features.basic_and_up') }}
            </span>
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>
