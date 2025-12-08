<script setup lang="ts">
import { get } from '@vueuse/core';
import { useIntegrationsData } from '~/composables/use-integrations-data';

const { t } = useI18n({ useScope: 'global' });
const { data: integrationData } = useIntegrationsData();

const exchangesWithKeys = computed(() => get(integrationData).exchanges.filter(item => item.isExchangeWithKey));
</script>

<template>
  <div class="flex flex-col-reverse lg:flex-row items-center gap-10 md:gap-20">
    <div class="flex flex-1 flex-col gap-2">
      <h6 class="text-h6 text-rui-primary">
        {{ t('home.exchanges.title') }}
      </h6>
      <h4 class="text-h4">
        {{ t('home.exchanges.subtitle') }}
      </h4>
      <div class="text-body-1 text-rui-text-secondary pt-2">
        {{ t('home.exchanges.detail') }}
      </div>
      <div class="pt-4">
        <div
          class="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          <div
            v-for="item in exchangesWithKeys"
            :key="item.label"
            class="flex items-center gap-3 text-subtitle-1 font-bold"
          >
            <div class="w-8 h-8 rounded-full overflow-hidden">
              <NuxtImg
                :src="item.image"
                :alt="item.label"
                width="32"
                height="32"
                loading="lazy"
                class="w-full h-full"
              />
            </div>
            {{ item.label }}
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1">
      <NuxtImg
        class="overflow-hidden"
        :alt="t('home.exchanges.title')"
        src="/img/exchanges.png"
        format="webp"
        loading="lazy"
        width="795"
        height="428"
      />
    </div>
  </div>
</template>
