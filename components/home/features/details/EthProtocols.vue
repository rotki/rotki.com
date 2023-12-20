<script setup lang="ts">
const { t } = useI18n();

const data = [
  {
    image: '/img/defi/makerdao.png',
    name: t('home.eth_protocols.protocols.maker_dao.title'),
    description: t('home.eth_protocols.protocols.maker_dao.description'),
  },
  {
    image: '/img/defi/aave.png',
    name: t('home.eth_protocols.protocols.aave.title'),
    description: t('home.eth_protocols.protocols.aave.description'),
  },
  {
    image: '/img/defi/compound.png',
    name: t('home.eth_protocols.protocols.compound.title'),
    description: t('home.eth_protocols.protocols.compound.description'),
  },
  {
    image: '/img/defi/yearn.png',
    name: t('home.eth_protocols.protocols.yearn_vaults.title'),
    description: t('home.eth_protocols.protocols.yearn_vaults.description'),
  },
  {
    image: '/img/defi/uniswap.png',
    name: t('home.eth_protocols.protocols.uniswap.title'),
    description: t('home.eth_protocols.protocols.uniswap.description'),
  },
  {
    image: '/img/defi/balancer.png',
    name: t('home.eth_protocols.protocols.balancer.title'),
    description: t('home.eth_protocols.protocols.balancer.description'),
  },
];
</script>

<template>
  <div class="flex flex-1 flex-col gap-4">
    <h5 class="text-h5 text-rui-primary">
      {{ t('home.eth_protocols.title') }}
    </h5>
    <h4 class="text-h4">{{ t('home.eth_protocols.subtitle') }}</h4>
    <div
      class="text-body-1 text-rui-text-secondary whitespace-break-spaces pt-2"
    >
      {{ t('home.eth_protocols.detail') }}
    </div>
  </div>
  <div class="pt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <div
      v-for="item in data"
      :key="item.name"
      class="bg-rui-primary/[0.04] rounded p-4 flex gap-4 items-center"
    >
      <div class="w-10 h-10 shrink-0 rounded-full overflow-hidden">
        <img :src="item.image" :alt="item.name" class="w-full h-full" />
      </div>
      <div>
        <div class="text-body-1">{{ item.name }}</div>
        <div class="text-body-2 text-rui-text-secondary">
          {{ item.description }}
        </div>
      </div>
    </div>
  </div>
  <div class="text-caption text-rui-text-secondary pt-6">
    * {{ t('home.eth_protocols.watcher_note') }}
  </div>
</template>
