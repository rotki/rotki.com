<script setup lang="ts">
import PageTabs, { type PageTabItem } from '~/components/common/PageTabs.vue';
import PageLayout from '~/components/layout/PageLayout.vue';
import { usePageSeo } from '~/composables/use-page-seo';

defineSlots<{
  default: () => void;
}>();

const { t } = useI18n({ useScope: 'global' });

usePageSeo('Sponsor', 'Sponsor rotki\'s development and support independent, local-first, privacy-preserving open-source software.', '/sponsor/mint');

const tabModelValue = ref<string>('');

const tabs = computed<PageTabItem[]>(() => [
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
  <PageLayout>
    <div class="py-10 lg:py-16">
      <div class="container">
        <div class="flex flex-col xl:flex-row gap-6">
          <PageTabs
            v-model="tabModelValue"
            :tabs="tabs"
          />

          <div class="flex-1 overflow-x-auto">
            <slot />
          </div>
        </div>
      </div>
    </div>
  </PageLayout>
</template>
