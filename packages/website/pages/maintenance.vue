<script setup lang="ts">
import { commonAttrs, noIndex } from '~/utils/metadata';

useHead({
  title: 'maintenance',
  meta: [
    {
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
const { t } = useI18n({ useScope: 'global' });

if (!maintenance)
  navigateTo('/');

const otherHeight = inject('otherHeight', 0);

const wrapperStyle = computed<{ minHeight: string }>(() => ({
  minHeight: `calc(100vh - ${otherHeight}px)`,
}));
</script>

<template>
  <div
    class="container w-full flex flex-col lg:flex-row gap-10 lg:gap-20 items-center justify-center text-center lg:text-left py-4"
    :style="wrapperStyle"
  >
    <img
      class="w-1/3 lg:w-1/2 max-w-[40rem]"
      alt="rotki maintenance"
      src="/img/maintenance.svg"
      width="640"
      height="480"
      loading="lazy"
    />

    <div class="flex flex-col gap-4">
      <h6 class="text-h6 text-rui-primary">
        {{ t('maintenance.title') }}
      </h6>

      <h3 class="text-h3 font-black text-rui-text">
        {{ t('maintenance.heading') }}
      </h3>

      <p class="text-black/60 text-body-1 pt-2 mb-0">
        {{ t('maintenance.description.line_one') }}
        <br />
        {{ t('maintenance.description.line_two') }}
        <a
          class="text-rui-primary hover:text-rui-primary-darker font-bold"
          :href="emailMailto"
          target="_blank"
        >
          {{ email }}
        </a>
      </p>
    </div>
  </div>
</template>
