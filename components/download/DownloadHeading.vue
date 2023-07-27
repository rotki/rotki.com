<script lang="ts" setup>
import { type DownloadItemProps } from '~/components/download/DownloadItem.vue';

defineProps<{ version: string; links: DownloadItemProps[] }>();

const { t } = useI18n();
const css = useCssModule();
</script>

<template>
  <div :class="css.wrapper">
    <div :class="css.wrapper__container" class="container">
      <div :class="css.titles">
        <h6 :class="css.title">
          {{ t('download.heading.download_rotki') }}
        </h6>
        <h3 :class="css.description">
          {{ t('download.heading.description') }}
        </h3>
      </div>
      <div :class="css.links">
        <DownloadItem
          v-for="(link, i) in links"
          v-bind="link"
          :key="i"
          :class="css.link"
        />
      </div>
      <p :class="css.version">
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
        @apply text-rui-light-primary text-h6;
      }

      .description {
        @apply text-rui-text text-h3;
      }
    }

    .links {
      @apply grid gap-6 grid-cols-2 lg:grid-cols-4 mb-6;

      .link {
        @apply w-full;
      }
    }

    .version {
      @apply text-body-1 text-rui-light-secondary;
    }
  }
}
</style>
