<script setup lang="ts">
withDefaults(defineProps<{ landing?: boolean }>(), { landing: false });
const css = useCssModule();
</script>

<template>
  <div :class="css.row">
    <div :class="css.column">
      <NuxtLink
        v-if="landing"
        :class="css.link"
        to="/#features"
        rel="noreferrer"
      >
        Features
      </NuxtLink>
      <NuxtLink v-else :class="css.link" to="/" rel="noreferrer">
        Home
      </NuxtLink>
    </div>
    <div :class="css.column">
      <a
        :class="css.link"
        href="https://rotki.readthedocs.io/en/latest/index.html"
        rel="noreferrer"
        target="_blank"
      >
        Documentation
      </a>
    </div>
    <div :class="css.column">
      <a
        :class="css.link"
        href="https://blog.rotki.com/"
        rel="noreferrer"
        target="_blank"
      >
        Blog
      </a>
    </div>
    <div :class="css.column">
      <NuxtLink :class="css.link" to="/home"> Manage Premium</NuxtLink>
    </div>
    <div :class="css.column">
      <NuxtLink :class="css.link" to="/jobs"> Jobs </NuxtLink>
    </div>
    <div :class="css.column">
      <a :class="css.link" href="mailto:info@rotki.com" target="_blank">
        Contact
      </a>
    </div>
  </div>
</template>

<style lang="scss" module>
@import '~/assets/css/media.scss';

.row {
  @apply flex flex-row justify-around;

  @include for-size(phone-only) {
    @apply flex-wrap justify-center text-center;

    max-width: 100%;
  }
}

.column {
  @apply flex flex-col font-sans uppercase justify-center text-primary2;

  margin-left: 16px;
  margin-right: 16px;

  @include for-size(phone-only) {
    width: 100%;
    margin: 0 auto;
  }
}

.link {
  @apply hover:text-shade8;

  @include for-size(phone-only) {
    @apply py-2;
  }
}
</style>
