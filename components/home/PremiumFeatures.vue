<script setup lang="ts">
import type { RuiIcons } from '@rotki/ui-library';

const { t } = useI18n({ useScope: 'global' });

const data = computed<{ icon: RuiIcons; text: string; description: string }[]>(() => [
  {
    icon: 'lu-chart-pie',
    text: t('home.premium_features.features.graphs_and_statistics.title'),
    description: t(
      'home.premium_features.features.graphs_and_statistics.detail',
    ),
  },
  {
    icon: 'lu-layers',
    text: t('home.premium_features.features.premium_staking.title'),
    description: t('home.premium_features.features.premium_staking.detail'),
  },
  {
    icon: 'lu-history',
    text: t('home.premium_features.features.history.title'),
    description: t('home.premium_features.features.history.detail'),
  },
  {
    icon: 'lu-landmark',
    text: t('home.premium_features.features.dex_support.title'),
    description: t('home.premium_features.features.dex_support.detail'),
  },

  {
    icon: 'lu-chart-no-axes-column',
    text: t('home.premium_features.features.premium_defi.title'),
    description: t('home.premium_features.features.premium_defi.detail'),
  },
]);
</script>

<template>
  <div class="py-20 container">
    <div class="lg:px-8 grid md:grid-cols-2 gap-x-16 gap-y-10">
      <div class="flex flex-col gap-4">
        <h4 class="text-h4">
          {{ t('home.premium_features.title') }}
        </h4>
        <div class="text-body-1 text-rui-text-secondary">
          {{ t('home.premium_features.subtitle') }}
        </div>
        <ButtonLink
          to="/products"
          variant="outlined"
          size="lg"
          class="mt-4"
        >
          {{ t('actions.get_premium') }}
        </ButtonLink>
      </div>
      <div
        v-for="item in data"
        :key="item.text"
        class="flex items-start gap-4"
      >
        <div class="p-3 rounded-lg bg-rui-primary text-white">
          <RuiIcon :name="item.icon" />
        </div>
        <div class="flex flex-col gap-2">
          <h5 class="text-h5">
            {{ item.text }}
          </h5>
          <div
            class="text-body-1 text-rui-text-secondary whitespace-break-spaces"
          >
            {{ item.description }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
