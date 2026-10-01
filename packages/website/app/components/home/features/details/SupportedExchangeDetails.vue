<script setup lang="ts">
import type { IntegrationData } from '~/types/integrations';
import { get } from '@vueuse/shared';
import { useIntegrationsData } from '~/composables/use-integrations-data';

const { t } = useI18n({ useScope: 'global' });
const { data: integrationData } = useIntegrationsData();

const exchangesWithKeys = computed<IntegrationData['exchanges']>(() => get(integrationData).exchanges.filter(item => item.isExchangeWithKey));
</script>

<template>
  <div class="flex flex-col-reverse lg:flex-row items-center gap-10 md:gap-20">
    <div class="flex flex-1 flex-col gap-2">
      <p class="text-subtitle-1 font-medium text-rui-primary">
        {{ t('home.exchanges.title') }}
      </p>
      <h3 class="text-h5 !font-bold">
        {{ t('home.exchanges.subtitle') }}
      </h3>
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
              <img
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
      <img
        class="rounded-xl border border-rui-grey-200 shadow-sm"
        :alt="t('home.exchanges.title')"
        src="/img/exchanges.webp"
        srcset="/img/exchanges-654w.webp 654w, /img/exchanges-1308w.webp 1308w, /img/exchanges.webp 2400w"
        sizes="(min-width: 1024px) min(654px, 50vw), 100vw"
        loading="lazy"
        width="654"
        height="409"
      />
    </div>
  </div>
</template>
