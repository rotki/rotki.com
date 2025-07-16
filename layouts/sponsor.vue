<script setup lang="ts">
import Default from '~/layouts/default.vue';
import { commonAttrs, noIndex } from '~/utils/metadata';

const { t } = useI18n({ useScope: 'global' });

useHead({
  title: 'sponsor',
  meta: [
    {
      name: 'sponsor',
      content: 'Sponsor rotki\'s next release',
    },
    noIndex(),
  ],
  ...commonAttrs(),
});

const tabModelValue = ref();

const tabs = [
  {
    label: t('sponsor.tabs.sponsor'),
    icon: 'lu-handshake',
    to: '/sponsor/sponsor',
  },
  {
    label: t('sponsor.tabs.leaderboard'),
    icon: 'lu-trophy',
    to: '/sponsor/leaderboard',
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
