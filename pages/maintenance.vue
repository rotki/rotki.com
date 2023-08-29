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

const {
  public: {
    maintenance,
    contact: { emailMailto, email },
  },
} = useRuntimeConfig();

if (!maintenance) {
  navigateTo('/');
}

const css = useCssModule();
</script>

<template>
  <div :class="css.wrapper">
    <img
      :class="css.image"
      alt="rotki maintenance"
      src="/img/maintenance.svg"
    />

    <TextHeading :class="css.heading">We'll be back soon!</TextHeading>

    <div :class="css.description">
      Sorry for the inconvenience but we're performing some maintenance at the
      moment. <br />
      If you need anything, you can always contact us on
      <a :class="css.link" :href="emailMailto" target="_blank">
        {{ email }}
      </a>
    </div>
  </div>
</template>

<style lang="scss" module>
.wrapper {
  @apply w-full min-h-full flex flex-col items-center justify-center text-center py-28 px-8;
}

.image {
  width: 500px;
}

.link {
  @apply text-rui-primary hover:text-rui-primary-darker font-bold;
}

.heading {
  @apply text-4xl;
}

.description {
  @apply text-rui-text text-base mt-8 text-center text-xl;
}
</style>
