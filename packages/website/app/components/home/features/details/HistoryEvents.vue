<script setup lang="ts">
const { t } = useI18n({ useScope: 'global' });

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
        class="rounded-xl"
        :alt="t('home.history_events.title')"
        src="/img/history_events.webp"
        srcset="/img/history_events-654w.webp 654w, /img/history_events-1308w.webp 1308w, /img/history_events.webp 2400w"
        sizes="(min-width: 640px) min(654px, 50vw), 100vw"
        loading="lazy"
        width="654"
        height="523"
      />
    </div>
    <div class="flex flex-1 flex-col gap-2">
      <p class="text-subtitle-1 font-medium text-rui-primary">
        {{ t('home.history_events.title') }}
      </p>
      <h3 class="text-h5 !font-bold">
        {{ t('home.history_events.subtitle') }}
      </h3>
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
