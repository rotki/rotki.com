<script setup lang="ts">
const { t } = useI18n();

const features = [
  {
    title: t('home.history_events.features.comprehensive.title'),
    description: t('home.history_events.features.comprehensive.description'),
  },
  {
    title: t('home.history_events.features.categorization.title'),
    description: t('home.history_events.features.categorization.description'),
  },
  {
    title: t('home.history_events.features.customizable.title'),
    description: t('home.history_events.features.customizable.description'),
  },
  {
    title: t('home.history_events.features.filter.title'),
    description: t('home.history_events.features.filter.description'),
  },
  {
    title: t('home.history_events.features.csv_export.title'),
    description: t('home.history_events.features.csv_export.description'),
  },
];
</script>

<template>
  <div class="flex flex-col sm:flex-row items-center gap-10 md:gap-20">
    <div class="flex-1">
      <img
        class="rounded-xl overflow-hidden"
        :alt="t('home.history_events.title')"
        src="/img/history_events.webp"
      />
    </div>
    <div class="flex flex-1 flex-col gap-2">
      <h6 class="text-h6 text-rui-primary">
        {{ t('home.history_events.title') }}
      </h6>
      <h6 class="text-h6">
        {{ t('home.history_events.subtitle') }}
      </h6>
      <div class="pt-4">
        <div class="font-bold pb-2">
          {{ t('home.history_events.key_features') }}
        </div>

        <ul class="list-disc pl-4 text-rui-text-secondary leading-7 flex flex-col gap-1">
          <li
            v-for="feature in features"
            :key="feature.title"
          >
            <b class="font-medium text-rui-text">{{ feature.title }}: </b>{{ feature.description }}
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
