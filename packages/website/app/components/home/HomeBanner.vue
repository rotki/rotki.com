<script setup lang="ts">
import type { RuiIcons } from '@rotki/ui-library';
import { get } from '@vueuse/shared';
import AppShowcaseSlider from '~/components/common/AppShowcaseSlider.vue';
import ButtonLink from '~/components/common/ButtonLink.vue';
import { useIntegrationsData } from '~/composables/use-integrations-data';

const { t } = useI18n({ useScope: 'global' });

const { public: { contact: { github } } } = useRuntimeConfig();

const repositoryUrl = `${github}/rotki`;

const highlights: string[] = [
  t('home.hero.highlights.free'),
  t('home.hero.highlights.platforms'),
  t('home.hero.highlights.no_account'),
];

const { integrationCount } = useIntegrationsData();

/*
 * Repository figures are rounded down (4,039 stars and 218 contributors on 2026-10-01)
 * so they stay true as they grow. Update them now and then, never round up.
 */
const stats = computed<{ icon: RuiIcons; value: string; label: string; to: string }[]>(() => [
  {
    icon: 'lu-star',
    value: '4,000+',
    label: t('home.stats.stars'),
    to: repositoryUrl,
  },
  {
    icon: 'lu-users',
    value: '200+',
    label: t('home.stats.contributors'),
    to: `${repositoryUrl}/graphs/contributors`,
  },
  {
    icon: 'lu-plug',
    value: `${get(integrationCount)}+`,
    label: t('home.stats.integrations'),
    to: '/integrations',
  },
  {
    icon: 'lu-calendar',
    value: '2018',
    label: t('home.stats.since'),
    to: '/values',
  },
]);
</script>

<template>
  <div class="container pt-14 md:pt-20">
    <div class="text-center flex flex-col gap-6 items-center">
      <NuxtLink
        to="/compare"
        class="inline-flex items-center gap-2 rounded-full border border-rui-primary/20 bg-rui-primary/[0.04] px-4 py-1.5 text-body-2 text-rui-primary hover:bg-rui-primary/[0.08] transition-colors"
      >
        <RuiIcon
          name="lu-shield-check"
          size="16"
        />
        {{ t('home.hero.eyebrow') }}
        <RuiIcon
          name="lu-arrow-right"
          size="14"
        />
      </NuxtLink>
      <h1 class="text-h4 md:text-h3 lg:text-[3.25rem] lg:leading-[1.15] !font-bold max-w-[860px] text-balance">
        {{ t('home.hero.title') }}
      </h1>
      <p class="text-body-1 md:text-h6 text-rui-text-secondary !font-normal max-w-[680px] text-balance">
        {{ t('home.hero.motto') }}
      </p>
      <div class="flex flex-col sm:flex-row items-center gap-3 mt-2">
        <ButtonLink
          to="/download"
          size="lg"
          color="primary"
          rounded
          variant="default"
        >
          <template #prepend>
            <RuiIcon
              size="20"
              name="lu-download"
            />
          </template>
          {{ t('actions.download_for_free') }}
        </ButtonLink>
        <ButtonLink
          :to="repositoryUrl"
          external
          size="lg"
          color="primary"
          rounded
          variant="outlined"
        >
          <template #prepend>
            <RuiIcon
              size="20"
              name="lu-github"
            />
          </template>
          {{ t('home.hero.view_source') }}
        </ButtonLink>
      </div>
      <ul class="flex flex-wrap justify-center gap-x-6 gap-y-2 text-body-2 text-rui-text-secondary">
        <li
          v-for="highlight in highlights"
          :key="highlight"
          class="flex items-center gap-1.5"
        >
          <RuiIcon
            name="lu-check"
            size="16"
            class="text-rui-success"
          />
          {{ highlight }}
        </li>
      </ul>
    </div>
  </div>
  <AppShowcaseSlider class="mt-12 md:mt-16 mb-16 md:mb-24">
    <ul class="grid grid-cols-2 sm:grid-cols-4 gap-y-4 sm:divide-x divide-rui-grey-200 sm:-mx-4 md:-mx-8">
      <li
        v-for="stat in stats"
        :key="stat.label"
      >
        <NuxtLink
          :to="stat.to"
          :external="stat.to.startsWith('http')"
          :target="stat.to.startsWith('http') ? '_blank' : undefined"
          class="flex flex-col items-center gap-0.5 px-2 sm:px-4 md:px-8 group"
        >
          <span class="flex items-center gap-1.5 text-h6 md:text-h5 !font-bold text-rui-text group-hover:text-rui-primary transition-colors">
            <RuiIcon
              :name="stat.icon"
              size="18"
              class="text-rui-primary"
            />
            {{ stat.value }}
          </span>
          <span class="text-caption md:text-body-2 text-rui-text-secondary whitespace-nowrap">
            {{ stat.label }}
          </span>
        </NuxtLink>
      </li>
    </ul>
  </AppShowcaseSlider>
</template>
