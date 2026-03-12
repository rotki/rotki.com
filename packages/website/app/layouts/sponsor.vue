<script setup lang="ts">
import { usePageSeo } from '~/composables/use-page-seo';
import Default from '~/layouts/default.vue';

interface TabItem {
  label: string;
  icon: string;
  to: string;
}

const { t } = useI18n({ useScope: 'global' });

usePageSeo('Sponsor', 'Sponsor rotki\'s development and support independent, local-first, privacy-preserving open-source software.', '/sponsor/mint');

const tabModelValue = ref<string>();

const tabs = computed<TabItem[]>(() => [
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
]);
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
