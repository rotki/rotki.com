<script setup lang="ts">
import type { RuiIcons } from '@rotki/ui-library';

const { t } = useI18n();

const data: { icon: RuiIcons; text: string; tooltip: string }[] = [
  {
    icon: 'open-source-line',
    text: t('home.advantages.open_source.title'),
    tooltip: t('home.advantages.open_source.description'),
  },
  {
    icon: 'computer-line',
    text: t('home.advantages.local_app.title'),
    tooltip: t('home.advantages.local_app.description'),
  },
  {
    icon: 'database-line',
    text: t('home.advantages.own_your_data.title'),
    tooltip: t('home.advantages.own_your_data.description'),
  },
];
</script>

<template>
  <div class="container pt-16 md:pt-20">
    <div class="text-center flex flex-col gap-6 items-center">
      <h3 class="text-h4 md:text-h3 !font-bold max-w-[800px]">
        {{ t('home.hero.title') }}
      </h3>
      <h5
        class="text-h6 md:text-h5 text-rui-text-secondary !font-normal max-w-[630px]"
      >
        {{ t('home.hero.motto') }}
      </h5>
    </div>
  </div>
  <AppShowcaseSlider class="mt-16 mb-16 md:mb-48">
    <div
      class="flex flex-col sm:flex-row font-medium py-2 divide-y sm:divide-y-0 sm:divide-x sm:-mx-4 md:-mx-8"
    >
      <div
        v-for="item in data"
        :key="item.text"
        class="flex items-center justify-center text-rui-text-secondary gap-2 py-5 md:py-0 sm:px-4 md:px-8 flex-1 cursor-pointer"
      >
        <RuiIcon :name="item.icon" />
        <RuiTooltip
          tooltip-class="max-w-[10rem]"
          :open-delay="400"
        >
          <template #activator>
            <div class="whitespace-nowrap">
              {{ item.text }}
            </div>
          </template>
          {{ item.tooltip }}
        </RuiTooltip>
      </div>
    </div>
  </AppShowcaseSlider>
</template>
