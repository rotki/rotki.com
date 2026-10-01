<script setup lang="ts">
import PageLayout from '~/components/layout/PageLayout.vue';

interface SponsorTab {
  icon: string;
  label: string;
  to: string;
}

defineSlots<{
  default: () => void;
}>();

// Each sponsor page sets its own SEO; a layout-level call gave /sponsor/submit-name a canonical pointing at /sponsor/mint
const { t } = useI18n({ useScope: 'global' });

const tabs = computed<SponsorTab[]>(() => [
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
    <div class="pt-8 pb-14 lg:pt-10 lg:pb-20">
      <div class="container">
        <!-- Three short sections, so a centered tab bar replaces the account-style sidebar and the content gets the full width -->
        <nav
          :aria-label="t('sponsor.tabs.aria_label')"
          class="flex justify-center mb-10 lg:mb-14"
        >
          <ul class="inline-flex items-center gap-1 rounded-full border border-rui-grey-200 bg-rui-grey-50 p-1">
            <li
              v-for="tab in tabs"
              :key="tab.to"
            >
              <NuxtLink
                :to="tab.to"
                class="flex items-center gap-2 rounded-full px-3 sm:px-4 py-2 text-body-2 font-medium text-rui-text-secondary whitespace-nowrap transition-colors hover:text-rui-text"
                active-class="!text-rui-primary bg-white dark:bg-rui-grey-800 shadow-sm"
              >
                <RuiIcon
                  :name="tab.icon"
                  size="16"
                  class="hidden sm:block shrink-0"
                />
                {{ tab.label }}
              </NuxtLink>
            </li>
          </ul>
        </nav>

        <slot />
      </div>
    </div>
  </PageLayout>
</template>
