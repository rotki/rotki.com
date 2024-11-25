<script setup lang="ts">
import { commonAttrs, noIndex } from '~/utils/metadata';

useHead({
  title: 'maintenance',
  meta: [
    {
      key: 'description',
      name: 'description',
      content: 'rotki is currently undergoing maintenance please come back later',
    },
    noIndex(),
  ],
  ...commonAttrs(),
});

definePageMeta({
  layout: 'landing',
});

const { public: { maintenance, contact: { emailMailto, email } } } = useRuntimeConfig();
const { t } = useI18n();

if (!maintenance)
  navigateTo('/');

const otherHeight = inject('otherHeight', 0);
</script>

<template>
  <div
    class="container"
    :class="[$style.wrapper]"
  >
    <img
      :class="$style.image"
      alt="rotki maintenance"
      src="/img/maintenance.svg"
    />

    <div class="flex flex-col gap-4">
      <h6 class="text-h6 text-rui-primary">
        {{ t('maintenance.title') }}
      </h6>

      <h3 :class="$style.heading">
        {{ t('maintenance.heading') }}
      </h3>

      <p :class="$style.description">
        {{ t('maintenance.description.line_one') }}
        <br />
        {{ t('maintenance.description.line_two') }}
        <a
          :class="$style.link"
          :href="emailMailto"
          target="_blank"
        >
          {{ email }}
        </a>
      </p>
    </div>
  </div>
</template>

<style lang="scss" module>
.wrapper {
  @apply w-full flex flex-col lg:flex-row gap-10 lg:gap-20 items-center justify-center;
  @apply text-center lg:text-left py-4;
  min-height: calc(100vh - v-bind(otherHeight) * 1px);
}

.image {
  @apply w-1/3 lg:w-1/2 max-w-[40rem];
}

.link {
  @apply text-rui-primary hover:text-rui-primary-darker font-bold;
}

.heading {
  @apply text-h3 font-black text-rui-text;
}

.description {
  @apply text-black/60 text-body-1 pt-2 mb-0;
}
</style>
