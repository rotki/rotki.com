<script lang="ts" setup>
import type { DownloadItem } from '~/types/download';

defineProps<{ version: string; links: DownloadItem[] }>();

const { t } = useI18n();
</script>

<template>
  <div :class="$style.wrapper">
    <div
      :class="$style.wrapper__container"
      class="container"
    >
      <div :class="$style.titles">
        <h6 :class="$style.title">
          {{ t('download.heading.download_rotki') }}
        </h6>
        <h3 :class="$style.description">
          {{ t('download.heading.description') }}
        </h3>
      </div>
      <div :class="$style.links">
        <DownloadItem
          v-for="(link, i) in links"
          :key="i"
          :data="link"
          :class="$style.link"
        />
      </div>
      <p :class="$style.version">
        {{ t('download.latest_release') }}: {{ version }}
      </p>
    </div>
  </div>
</template>

<style lang="scss" module>
.wrapper {
  @apply py-10 lg:py-20;

  &__container {
    @apply flex flex-col;

    .titles {
      @apply flex flex-col space-y-4 mb-16;

      .title {
        @apply text-rui-light-primary text-h6 font-medium;
      }

      .description {
        @apply text-rui-text text-h4;
      }
    }

    .links {
      @apply grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-6;

      .link {
        @apply w-full;
      }
    }

    .version {
      @apply text-body-1 text-rui-text-secondary;
    }
  }
}
</style>
