<script setup lang="ts">
const { t } = useI18n({ useScope: 'global' });

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
      <p class="text-subtitle-1 font-medium text-rui-primary">
        {{ t('home.evm_protocols.title') }}
      </p>
      <h3 class="text-h5 !font-bold">
        {{ t('home.evm_protocols.subtitle') }}
      </h3>
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
    <div class="flex-1">
      <img
        class="rounded-xl border border-rui-grey-200 shadow-sm"
        :alt="t('home.evm_protocols.image_alt')"
        src="/img/evm_protocols.webp"
        srcset="/img/evm_protocols-654w.webp 654w, /img/evm_protocols-1308w.webp 1308w, /img/evm_protocols.webp 2400w"
        sizes="(min-width: 1024px) min(654px, 50vw), 100vw"
        loading="lazy"
        width="654"
        height="409"
      />
    </div>
  </div>
</template>
