<script setup lang="ts">
import { commonAttrs, noIndex } from '~/utils/metadata';

useHead({
  title: 'maintenance',
  meta: [
    {
      key: 'description',
      name: 'description',
      content:
        'rotki is currently undergoing maintenance please come back later',
    },
    noIndex(),
  ],
  ...commonAttrs(),
});

definePageMeta({
  layout: 'landing',
});

const {
  public: {
    maintenance,
    contact: { emailMailto, email },
  },
} = useRuntimeConfig();

if (!maintenance)
  navigateTo('/');

const css = useCssModule();
const otherHeight = inject('otherHeight', 0);
</script>

<template>
  <div
    class="container"
    :class="[css.wrapper]"
  >
    <img
      :class="css.image"
      alt="rotki maintenance"
      src="/img/maintenance.svg"
    />

    <div class="flex flex-col gap-4">
      <h6 class="text-h6 text-rui-primary">
        Under maintenance
      </h6>

      <h3 :class="css.heading">
        We'll be back soon!
      </h3>

      <p :class="css.description">
        Sorry for the inconvenience, but we're performing some maintenance at the
        moment. <br />
        If you need anything, you can always contact us on
        <a
          :class="css.link"
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
