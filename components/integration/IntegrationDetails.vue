<script setup lang="ts">
import { get } from '@vueuse/core';
import { useIntegrationsData } from '~/composables/integrations';

enum TabCategory {
  ALL = 'all',
  BLOCKCHAINS = 'blockchains',
  EXCHANGES = 'exchanges',
  PROTOCOLS = 'protocols',
}
const search = ref<string>('');
const searchDebounced = refDebounced(search, 200);
const tab = ref<TabCategory>(TabCategory.ALL);

const { t } = useI18n();

const tabCategoriesLabel = computed(() => ({
  [TabCategory.ALL]: t('integration.tabs.all'),
  [TabCategory.BLOCKCHAINS]: t('integration.blockchains.title'),
  [TabCategory.EXCHANGES]: t('integration.exchanges.title'),
  [TabCategory.PROTOCOLS]: t('integration.protocols.title'),
}));

function cleanString(text: string) {
  return text.toLocaleLowerCase().trim();
}

const { data: integrationData } = useIntegrationsData();

const data = computed(() => {
  const searchVal = get(searchDebounced);

  const filter = (data: { label: string; image: string }[]) => data.filter(item => cleanString(item.label).includes(cleanString(searchVal)));

  const integrationDataVal = get(integrationData);

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
          variant="outlined"
          :label="t('integration.search')"
          prepend-icon="search-line"
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
              class="rounded cursor-pointer"
              active-class="!bg-rui-primary [&:after]:hidden !text-white"
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
        <ReuseNotFound
          v-if="isAllSelected && total === 0"
          :keyword="searchDebounced"
        />
        <template
          v-for="(datum, key) in data"
          v-else
          :key="key"
        >
          <div
            v-if="(isAllSelected && datum.data.length > 0) || tab === key"
            class="flex flex-col gap-10"
          >
            <div class="flex flex-col gap-4">
              <div class="text-h4">
                {{ datum.title }}
              </div>
              <div class="text-rui-text-secondary text-body-1">
                {{ datum.description }}
              </div>
            </div>
            <ReuseNotFound
              v-if="datum.data.length === 0"
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
              <template
                v-for="item in datum.data"
                :key="item.label"
              >
                <RuiTooltip :open-delay="200">
                  <template #activator>
                    <div class="w-14 h-14 border border-rui-grey-300 rounded p-2.5">
                      <img
                        class="w-full h-full"
                        :src="item.image"
                        :alt="item.label"
                      />
                    </div>
                  </template>
                  {{ item.label }}
                </RuiTooltip>
              </template>
            </TransitionGroup>
          </div>
        </template>
      </TransitionGroup>
    </div>
  </div>
</template>
