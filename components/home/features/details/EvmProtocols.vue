<script setup lang="ts">
import type { IntegrationItem } from '~/types/integrations';
import { get } from '@vueuse/core';
import { useIntegrationsData } from '~/composables/integrations';

const { t } = useI18n();

// Sorted by TVL, source: Defillama
const biggestProtocols: string[] = [
  'ETH2',
  'Lido eth',
  'Aave',
  'EigenLayer',
  'Uniswap',
  'Morpho',
  'Base',
  'Arbitrum One',
  'Makerdao DSR',
  'Spark',
  'Compound',
  'Optimism',
  'Convex',
  'Polygon',
  'Aerodrome Finance',
  'GMX',
  'Echo',
  'Aura Finance',
  'Defisaver',
  'Locked GNO',
  'FRAX',
  'Liquity',
  'Yearn Governance',
  'Puffer',
  'ZkSync',
  'Extrafi',
  'Metamask swaps',
  'Velodrome finance',
  'Cowswap',
  'Gearbox',
  'Juicebox',
  'Umami',
  'Pickle Finance',
  '1inch',
  'Kyber',
];

const { data: integrationData } = useIntegrationsData();

const protocolsData = computed<IntegrationItem[]>(() =>
  biggestProtocols.map(protocolName => get(integrationData).protocols.find(data => data.label === protocolName)).filter(item => !!item));

const features = [
  {
    title: t('home.evm_protocols.features.multi_chain_support.title'),
    description: t('home.evm_protocols.features.multi_chain_support.description'),
  },
  {
    title: t('home.evm_protocols.features.automatic_activity_importing.title'),
    description: t('home.evm_protocols.features.automatic_activity_importing.description'),
  },
  {
    title: t('home.evm_protocols.features.defi_balances.title'),
    description: t('home.evm_protocols.features.defi_balances.description'),
  },
  {
    title: t('home.evm_protocols.features.staking_yield.title'),
    description: t('home.evm_protocols.features.staking_yield.description'),
  },
  {
    title: t('home.evm_protocols.features.historical_data.title'),
    description: t('home.evm_protocols.features.historical_data.description'),
  },
];
</script>

<template>
  <div class="flex flex-col lg:flex-row items-center gap-10 md:gap-20">
    <div class="flex flex-1 flex-col gap-2">
      <h6 class="text-h6 text-rui-primary">
        {{ t('home.evm_protocols.title') }}
      </h6>
      <h6 class="text-h6">
        {{ t('home.evm_protocols.subtitle') }}
      </h6>
      <div class="pt-4">
        <div class="font-bold pb-2">
          {{ t('home.evm_protocols.key_features') }}
        </div>

        <ul class="list-disc pl-4 text-rui-text-secondary leading-7 flex flex-col gap-1">
          <li
            v-for="feature in features"
            :key="feature.title"
          >
            <b class="font-medium text-rui-text">{{ feature.title }}: </b>{{ feature.description }}
          </li>
        </ul>
      </div>
    </div>
    <div class="flex-1 rounded-xl bg-rui-primary/[0.1] py-4 sm:py-8 px-4 sm:px-6 grid grid-cols-5 min-[400px]:grid-cols-7 lg:grid-cols-5 xl:grid-cols-7 gap-2 sm:gap-4 justify-between">
      <RuiTooltip
        v-for="item in protocolsData"
        :key="item.label"
        :open-delay="200"
      >
        <template #activator>
          <div
            class="w-full h-full bg-white rounded-lg p-1 min-[400px]:p-2 flex items-center justify-center border border-rui-grey-300 aspect-square"
          >
            <img
              :src="item.image"
              :alt="item.label"
              class="w-full h-full"
            />
          </div>
        </template>
        {{ item.label }}
      </RuiTooltip>
    </div>
  </div>
</template>
