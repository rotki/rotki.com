<script setup lang="ts">
import { RuiDivider, RuiTab, RuiTabs, RuiTextField } from '@rotki/ui-library/components';
import { useBreakpoint } from '@rotki/ui-library/composables';
import { createReusableTemplate, refDebounced } from '@vueuse/core';
import { get, set } from '@vueuse/shared';
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { z } from 'zod';
import { useRoute, useRouter } from '#app';
import { ClientOnly } from '#components';
import IntegrationTile from '~/components/integration/IntegrationTile.vue';
import { useIntegrationsData } from '~/composables/use-integrations-data';
import { parseRouteParam } from '~/utils/query';

enum TabCategory {
  ALL = 'all',
  BLOCKCHAINS = 'blockchains',
  EXCHANGES = 'exchanges',
  PROTOCOLS = 'protocols',
}
const search = ref<string>('');
const searchDebounced = refDebounced(search, 200);
const tab = ref<TabCategory>(TabCategory.ALL);

const { t } = useI18n({ useScope: 'global' });

const router = useRouter();
const route = useRoute();

// Set initial tab based on URL hash
onMounted(() => {
  const hash = parseRouteParam(get(route).hash?.replace('#', ''), z.nativeEnum(TabCategory));
  if (hash) {
    set(tab, hash);
    router.replace({ hash: '' });
  }
});

const tabCategoriesLabel = computed<Record<TabCategory, string>>(() => ({
  [TabCategory.ALL]: t('integration.tabs.all'),
  [TabCategory.BLOCKCHAINS]: t('integration.blockchains.title'),
  [TabCategory.EXCHANGES]: t('integration.exchanges.title'),
  [TabCategory.PROTOCOLS]: t('integration.protocols.title'),
}));

function cleanString(text: string) {
  return text.toLocaleLowerCase().trim();
}

const { data: integrationData, filterDuplicateData } = useIntegrationsData();

interface IntegrationSection {
  title: string;
  description: string;
  data: { label: string; image: string }[];
}

const data = computed<Record<string, IntegrationSection>>(() => {
  const searchVal = get(searchDebounced);

  const filter = (data: { label: string; image: string }[]) => data.filter(item => cleanString(item.label).includes(cleanString(searchVal)));

  const integrationDataVal = filterDuplicateData({ ...get(integrationData) });

  return {
    [TabCategory.BLOCKCHAINS]: {
      title: t('integration.blockchains.title'),
      description: t('integration.blockchains.description'),
      data: filter(integrationDataVal.blockchains),
    },
    [TabCategory.EXCHANGES]: {
      title: t('integration.exchanges.title'),
      description: t('integration.exchanges.description'),
      data: filter(integrationDataVal.exchanges),
    },
    [TabCategory.PROTOCOLS]: {
      title: t('integration.protocols.title'),
      description: t('integration.protocols.description', { number: Math.floor(integrationDataVal.protocols.length / 10) * 10 }),
      data: filter(integrationDataVal.protocols),
    },
  };
});

const isAllSelected = computed<boolean>(() => get(tab) === 'all');
const total = computed<number>(() => Object.values(get(data)).reduce((accumulator, item) => accumulator + item.data.length, 0));

interface DisplayEntry {
  key: string;
  section?: IntegrationSection;
}

/**
 * The outer TransitionGroup's children as one flat keyed list. A v-if/v-else or a
 * `<template v-for>` directly inside the group makes the server render fragment and
 * v-if comments that the client TransitionGroup drops, which breaks hydration.
 * An entry without a section is the "no results" message.
 */
const displayEntries = computed<DisplayEntry[]>(() => {
  const allSelected = get(isAllSelected);
  if (allSelected && get(total) === 0)
    return [{ key: 'not-found' }];

  const selectedTab = get(tab);
  return Object.entries(get(data))
    .filter(([key, section]) => (allSelected && section.data.length > 0) || selectedTab === key)
    .map(([key, section]) => ({ key, section }));
});

const [DefineNotFound, ReuseNotFound] = createReusableTemplate<{
  keyword: string;
}>();

const { isMdAndUp } = useBreakpoint();
</script>

<template>
  <DefineNotFound
    #default="{ keyword }"
    class="text-rui-text-secondary"
  >
    {{ t('integration.no_data_found', { keyword }) }}
  </DefineNotFound>
  <div class="py-10 md:py-20">
    <div class="container flex flex-col md:flex-row items-start gap-10 lg:gap-16">
      <div class="md:sticky md:top-20 w-full md:w-[18rem]">
        <RuiTextField
          v-model="search"
          :label="t('integration.search')"
          prepend-icon="lu-search"
          color="primary"
          clearable
        />
        <RuiDivider class="mb-4" />
        <ClientOnly>
          <RuiTabs
            v-model="tab"
            color="primary"
            :vertical="isMdAndUp"
            grow
          >
            <RuiTab
              v-for="(item, key) in tabCategoriesLabel"
              :key="key"
              :align="isMdAndUp ? 'start' : 'center'"
              :value="key"
            >
              {{ item }}
            </RuiTab>
          </RuiTabs>
        </ClientOnly>
      </div>
      <TransitionGroup
        tag="div"
        enter-active-class="transition"
        leave-active-class="transition h-0 overflow-hidden absolute"
        enter-from-class="opacity-0 transform -translate-y-10"
        leave-to-class="opacity-0"
        class="flex-1 flex flex-col gap-10"
      >
        <div
          v-for="entry in displayEntries"
          :key="entry.key"
          :class="{ 'flex flex-col gap-10': entry.section }"
        >
          <ReuseNotFound
            v-if="!entry.section"
            :keyword="searchDebounced"
          />
          <template v-else>
            <div class="flex flex-col gap-4">
              <h2 class="text-h3">
                {{ entry.section.title }}
              </h2>
              <p class="text-rui-text-secondary text-body-1">
                {{ entry.section.description }}
              </p>
            </div>
            <ReuseNotFound
              v-if="entry.section.data.length === 0"
              :keyword="searchDebounced"
            />
            <TransitionGroup
              v-else
              tag="div"
              move-class="transition-all"
              enter-active-class="transition-all"
              leave-active-class="transition-all absolute"
              enter-from-class="opacity-0"
              leave-to-class="opacity-0"
              class="flex flex-wrap gap-4"
            >
              <IntegrationTile
                v-for="item in entry.section.data"
                :key="item.label"
                :item="item"
              />
            </TransitionGroup>
          </template>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>
