<script setup lang="ts">
import { usePageSeoNoIndex } from '~/composables/use-page-seo';
import Default from '~/layouts/default.vue';

const { t } = useI18n({ useScope: 'global' });

usePageSeoNoIndex('sponsor');

const tabModelValue = ref();

const tabs = [
  {
    label: t('sponsor.tabs.sponsor'),
    icon: 'lu-handshake',
    to: '/sponsor/mint',
  },
  {
    label: t('sponsor.tabs.leaderboard'),
    icon: 'lu-trophy',
    to: '/sponsor/leaderboard',
  },
  {
    label: t('sponsor.tabs.submit_name'),
    icon: 'lu-user-plus',
    to: '/sponsor/submit-name',
  },
];
</script>

<template>
  <Default>
    <div class="py-10 lg:py-16">
      <div class="container">
        <div class="flex flex-col lg:flex-row gap-6">
          <div class="hidden lg:block w-[270px] shrink-0">
            <RuiTabs
              v-model="tabModelValue"
              vertical
              align="start"
              color="primary"
            >
              <RuiTab
                v-for="tab in tabs"
                :key="tab.to"
                link
                :to="tab.to"
              >
                <template #prepend>
                  <RuiIcon :name="tab.icon" />
                </template>
                {{ tab.label }}
              </RuiTab>
            </RuiTabs>
          </div>
          <div class="lg:hidden">
            <RuiTabs
              v-model="tabModelValue"
              grow
              color="primary"
            >
              <RuiTab
                v-for="tab in tabs"
                :key="tab.to"
                link
                :to="tab.to"
              >
                <template #prepend>
                  <RuiIcon
                    class="shrink-0"
                    :name="tab.icon"
                  />
                </template>
                {{ tab.label }}
              </RuiTab>
            </RuiTabs>
          </div>

          <div class="flex-1 overflow-x-auto">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </Default>
</template>
